/**
 * Using Rails-like standard naming convention for endpoints.
 * GET     /api/jobs              ->  index
 * POST    /api/jobs              ->  create
 * GET     /api/jobs/:id          ->  show
 * PUT     /api/jobs/:id          ->  update
 * DELETE  /api/jobs/:id          ->  destroy
 */



import _ from 'lodash';
import db, { User, JobAllocation, Solr, sequelizeQuarc, Sequelize, Region, JobScore,
  JobStatus, ClientPayment, ConsultantResponse } from '../../sqldb';
import logger from '../../components/logger';

function handleError(res, argStatusCode, err) {
  logger.error('job.controller.js : ', err);
  const statusCode = argStatusCode || 500;
  res.status(statusCode).json(err);
}


function cakeList(jsonArray, key, value) {
  const keyArray = _.map(jsonArray, key);
  const valueArray = _.map(jsonArray, value);
  const map = {};
  keyArray.map((item, iIndex) => {
    map[item] = valueArray[iIndex];
    return item;
  });
  return map;
}

// Gets a list of Jobs
export function index(req, res) {
  // Todo: ORM Impl: Writtern manual query becasue of currently
  // sequelize don't have Multidatabase Join Support
  const query = req.query.query || '';

  const rawStates = (req.query.status) ? req.query.status.split(',') : ['ALL'];
  const bucket = { HIGH_PRIORITY: [1], OPEN: [2], HOLD: [3], CLOSED: [4], ALL: [1, 2, 3, 4] };
  const states = [];

  rawStates.forEach((state) => {
    // add weight to each state depending on positon in state array
    if (isNaN(state) && bucket[state]) {
      bucket[state].forEach((s) => states.push(s));
    }

    if (_.isInteger(state) || ~bucket.ALL.indexOf(Number(state))) {
      states.push(state);
    }
  });

  const countQueryPr = (!req.query.meta && req.query.offset !== 0) ? [] : sequelizeQuarc.query(`
    SELECT
      COUNT(JobStatus.id) as jobStatusCount,
      JobStatus.name AS jobStatusName
    FROM gloryque_quarc.jobs AS Job LEFT JOIN gloryque_quarc.job_statuses AS JobStatus
        ON (Job.job_status_id = JobStatus.id)
      LEFT JOIN gloryque_quarc.job_allocations AS JobAllocation ON (Job.id = JobAllocation.job_id)
      LEFT JOIN gloryque_quarc.consultant_responses AS ConsultantResponse
        ON (ConsultantResponse.id = JobAllocation.consultant_response_id
        AND ConsultantResponse.user_id = '${req.user.id}')
      INNER JOIN gloryque_quantum.users AS User ON (Job.user_id = User.id)
    WHERE JobAllocation.user_id = ${req.user.id}
          AND JobAllocation.status = '1'
          AND ConsultantResponse.response_id = 1
          AND Job.status = '1'
          AND ((Job.role LIKE '%${query}%') OR (User.username LIKE '%${query}%')
           OR (User.name LIKE '%${query}%'))
    GROUP BY JobStatus.id`, { type: Sequelize.QueryTypes.SELECT });


  const queryPr = sequelizeQuarc.query(`
      SELECT
        Job.id,
        Job.user_id AS owner_id,
        Job.role,
        Job.job_code AS job_code,
        JobStatus.name AS job_status,
        JobStatus.id AS job_id,
        JobScore.consultant AS consultant_score,
        JobScore.id AS job_score,
        User.name AS owner,
        Client.name AS owner_name

      FROM gloryque_quarc.jobs AS Job LEFT JOIN gloryque_quarc.job_statuses AS JobStatus
          ON (Job.job_status_id = JobStatus.id)
        LEFT JOIN gloryque_quarc.job_scores AS JobScore ON (Job.job_score_id = JobScore.id)
        LEFT JOIN gloryque_quarc.job_allocations AS JobAllocation
        ON (Job.id = JobAllocation.job_id)
        LEFT JOIN gloryque_quarc.consultant_responses AS ConsultantResponse
          ON (ConsultantResponse.id = JobAllocation.consultant_response_id
          AND ConsultantResponse.user_id = '${req.user.id}')
        INNER JOIN gloryque_quantum.users AS User ON (Job.user_id = User.id)
        LEFT JOIN  gloryque_quantum.clients AS Client ON  (User.client_id = Client.id)
      WHERE JobAllocation.user_id = ${req.user.id} AND JobAllocation.status = '1'
      AND ConsultantResponse.response_id = 1 AND
            Job.status = '1'
            AND JobStatus.id IN (${states.join(',')})
            AND ((Job.role LIKE '%${query}%') OR (User.username LIKE '%${query}%')
            OR (User.name LIKE '%${query}%'))
      GROUP BY Job.id
      ORDER BY JobScore.consultant DESC
      LIMIT ${(req.query.limit > 20) ? 20 : req.query.limit || 10}
      OFFSET ${req.query.offset || 0}`,
      { type: Sequelize.QueryTypes.SELECT });
  return Promise.all([countQueryPr, queryPr])
      .then(prRe => {
        let jobsCount = cakeList(prRe[0], 'jobStatusName', 'jobStatusCount');
        jobsCount = {
          Open: jobsCount.Open || 0,
          'High Priority': jobsCount['High Priority'] || 0,
          Hold: jobsCount.Hold || 0,
          Closed: jobsCount.Closed || 0,
        };
        const jobs = prRe[1];
        return res.json({ jobs, meta: { jobsCount } });
      }).catch(err => handleError(res, 500, err));
}

// Gets a list of jobs depending on response id
export function search(req, res) {
  const userId = req.user.id;
  const response = { Accepted: 1, Hold: 2, Rejected: 3 };
  const responseId = response[req.query.response];

  const offset = req.query.offset || 0;
  const limit = (req.query.limit > 20) ? 20 : req.query.limit || 10;

  const fl = req.query.fl || [
    'updated_on', 'role', 'owner_id', 'consultant_score', 'direct_line_up', 'job_nature',
    'eng_mgr_name', 'eng_mgr_name_sf', 'max_sal', 'max_exp', 'recruiter_username', 'id',
    'job_code', 'client_name', 'client_name_sf', 'email', 'min_sal', 'min_exp', 'client_score',
    'type_s', 'screening_score', 'total_applicants', 'job_status', 'created_on',
    'job_location', 'vacancy', 'skills',
  ].join(',');


  sequelizeQuarc.query(`
        SELECT
            JA.job_id,
            JA.user_id,
            MAX(CR.id) AS consultant_response_id,
            CR.response_id,
            R.name
        FROM
            gloryque_quarc.job_allocations AS JA
                LEFT JOIN
            gloryque_quarc.consultant_responses AS CR ON CR.id = JA.consultant_response_id
                LEFT JOIN
            gloryque_quarc.responses AS R ON CR.response_id = R.id
        WHERE
            JA.user_id = ${userId} AND CR.response_id = ${responseId}
        GROUP BY CR.job_id , CR.user_id;
        `, { type: Sequelize.QueryTypes.SELECT })
    .then(argJobs => {
      const jobs = _.map(argJobs, 'job_id');
      const insideQuery = jobs.join(' OR ');
      // After getting job_id fetching data from Solr
      const solrQuery = Solr.createQuery()
        .q(`id:(${insideQuery}) AND type_s:job`)
        .fl(fl)
        .rows(limit)
        .start(offset);

      return Solr.get('select', solrQuery, (err, result) => {
        if (err) return handleError(res, 500, err);
        return res.json(result.response.docs);
      });
    })
    .catch(err => handleError(res, 500, err));
}

// List Jobs allocationed to consultant
export function allocationStatusNew(req, res) {
  const query = req.query.q || '';
  const rawStates = (req.query.status) ? req.query.status.split(',') : ['ALL'];
  // [{ id:0,name:'New'},{ id:1, name:'Accepted'},{id:2,name:'Hide'},
  // {id:3,name:'Rejected'},{id:'all',name:'All'}]
  const bucket = {
    NEW: [0], //  Using sql query Null is assumed as 0
    ACCEPTED: [1],
    HIDDEN: [2], // Proxy for HOLD
    HOLD: [2],
    REJECTED: [3],
    ALL: [0, 1, 2, 3],
  };

  const states = [];

  rawStates.forEach(state => {
    if (isNaN(state)) if (bucket[state.toUpperCase()]) bucket[state].map(s => states.push(s));

    if (_.isInteger(state) || ~bucket.ALL.indexOf(Number(state))) states.push(Number(state));
  });


  const sqlQuery = `
  SELECT * FROM (SELECT
    Job.id,
    Job.role,
    Job.user_id,
    Job.job_status_id,
    Job.job_score_id,
    Job.region_id,
    Job.min_sal,
    Job.max_sal,
    JobAllocation.id AS allocation_id,
    COALESCE(ConsultantResponse.response_id,0) AS response_id,
    Client.id AS client_id,
    Client.name AS owner_company,
    DATE(JobAllocation.updated_on) AS updated_on
  FROM gloryque_quarc.job_allocations AS JobAllocation LEFT JOIN gloryque_quarc.jobs AS Job
      ON (JobAllocation.job_id = Job.id AND Job.status = '1')
    LEFT JOIN gloryque_quarc.consultant_responses AS ConsultantResponse
      ON (JobAllocation.consultant_response_id = ConsultantResponse.id)
    LEFT JOIN gloryque_quantum.users AS User
      ON (Job.user_id = User.id)
    LEFT JOIN gloryque_quantum.clients AS Client
      ON ( Client.id = User.client_id)
  WHERE JobAllocation.user_id = ${req.user.id} AND Job.status = '1'
  AND JobAllocation.status = '1'
  GROUP BY JobAllocation.job_id
  ORDER BY JobAllocation.updated_on DESC
  ) AS TEMP

  ${states.length ?
    `WHERE (role LIKE "%${query}%" OR owner_company LIKE "%${query}%" )
    AND response_id IN (${states.join()})`
    : ''}

    ORDER BY  DATE(updated_on) DESC
  LIMIT ${req.query.limit ? parseInt(req.query.limit, 10) : 100}
  OFFSET ${req.query.offset || 0} `;

  const priorityPromise = JobStatus.findAll({
    attributes: ['id', 'name'],
  });

  sequelizeQuarc
    .query(sqlQuery, { type: Sequelize.QueryTypes.SELECT })
    .then(argJobs => {
      let jobs = argJobs;
      let jobCountPromise = [];
      if (parseInt(req.query.offset, 0) === 0) {
        const countQuery = `
            SELECT response_id ,count(response_id) AS count FROM (SELECT
                  Job.id ,
                COALESCE(ConsultantResponse.response_id,0) AS response_id
              FROM gloryque_quarc.job_allocations AS JobAllocation
              LEFT JOIN gloryque_quarc.jobs AS Job
                  ON (JobAllocation.job_id = Job.id AND Job.status = '1')
                LEFT JOIN gloryque_quarc.consultant_responses AS ConsultantResponse
                  ON (JobAllocation.consultant_response_id = ConsultantResponse.id)
                LEFT JOIN gloryque_quantum.users AS User
                  ON (Job.user_id = User.id)
                LEFT JOIN gloryque_quantum.clients AS Client
                  ON ( Client.id = User.client_id)
              WHERE JobAllocation.user_id = ${req.user.id} AND Job.status = '1'
              AND JobAllocation.status = '1'
              GROUP BY JobAllocation.job_id) AS TEMP
            GROUP BY  response_id`;

        jobCountPromise = sequelizeQuarc
          .query(countQuery, { type: Sequelize.QueryTypes.SELECT })
          .then(countResult => {
            const jobCountObject = cakeList(countResult, 'response_id', 'count');

            // Calculate all count
            const currentStatesCount = 4; //    ['NEW', 'ACCEPTED','HOLD', 'REJECTED'].length
            const jobCount = [];
            let total = 0;
            for (let i = 0; i < currentStatesCount; i++) {
              if (typeof jobCountObject[i] !== 'undefined') {
                total += jobCountObject[i];
              } else {
                jobCountObject[i] = 0;
              }
              jobCount.push({ id: i, count: jobCountObject[i] });
            }
            // ['NEW', 'ACCEPTED','HOLD', 'REJECTED'].length
            jobCount.push({ id: 'all', count: total });
            return jobCount;
          });
      }

      let promise = [];
      if (jobs.length) {
        const userIds = _.map(jobs, 'user_id');
        const regionIds = _.map(jobs, 'region_id');
        const jobScoreIds = _.map(jobs, 'job_score_id');
        const clientIds = _.map(jobs, 'client_id');
        const userPromise = User.findAll({
          attributes: ['id', 'name'],
          where: {
            id: userIds,
          },
        });

        const regionPromise = Region.findAll({
          attributes: ['id', 'region'],
          where: {
            id: regionIds,
          },
        });

        const jobScorePromise = JobScore.findAll({
          attributes: ['id', 'consultant'],
          where: {
            id: jobScoreIds,
          },
        });

        const clientPaymentPromise = ClientPayment.findAll({
          attributes: ['id', 'client_id', 'isFixed'],
          where: {
            client_id: clientIds,
          },
          raw: true,
        });

        promise = Promise.all([userPromise, regionPromise, jobScorePromise, priorityPromise,
          clientPaymentPromise, jobCountPromise])
          .then(promiseReturnArray => {
            const users = cakeList(promiseReturnArray[0], 'id', 'name');
            const regions = cakeList(promiseReturnArray[1], 'id', 'region');
            const jobScores = cakeList(promiseReturnArray[2], 'id', 'consultant');
            const priority = cakeList(promiseReturnArray[3], 'id', 'name');
            const deepClientPayments = promiseReturnArray[4];
            const jobsCount = promiseReturnArray[5];

            // DEEP Query Job ClientPayments
            const argClientPayments = {};
            deepClientPayments.map(item => {
              argClientPayments[item.client_id] = argClientPayments[item.client_id] ?
                argClientPayments[item.client_id] : [];
              argClientPayments[item.client_id].push(item);
              return item;
            });
            jobs = jobs.map(argJob => {
              const job = argJob;
              job.clientPayments = argClientPayments[job.client_id];
              return job;
            }); // DEEP Query Job ClientPayment
            jobs = jobs.map(argJob => {
              const job = argJob;
              job.clientPayments = argClientPayments[job.client_id];
              job.owner = users[parseInt(job.user_id, 10)];
              job.region = regions[parseInt(job.region_id, 10)];
              job.score = jobScores[parseInt(job.job_score_id, 10)];
              job.priority = priority[parseInt(job.job_status_id, 10)];
              if (job.clientPayments) {
                if (job.clientPayments.length > 0) {
                  if (job.clientPayments[0].isFixed === 1) {
                    job.payment = 'Fixed - Standard';
                  } else if (job.clientPayments[0].isFixed === 2) {
                    job.payment = 'Fixed - Customised';
                  } else if (job.clientPayments[0].isFixed === 3) {
                    job.payment = '1% EMI - Customised';
                  } else {
                    job.payment = '1% EMI - Standard';
                  }
                } else {
                  job.payment = '-';
                }
                delete job.clientPayments;
              }
              return job;
            });
            return { jobs, meta: { jobsCount } };
          });
      } else {
        promise = jobCountPromise.then(jobsCount => {
          const temp = { jobs: [], meta: { jobsCount } };
          return temp;
        });
      }
      return Promise.all([promise]).then(prRe => res.json(prRe[0]));
    })
  .catch(err => handleError(res, 500, err));
}

// List Jobs allocationed to consultant
export function allocationStatusNewCount(req, res) {
  return JobAllocation.count({
    where: { consultant_response_id: null, user_id: req.user.id },
    include: [{ model: db.Job, where: { status: 1 } }],
  })
    .then(count => res.json({ count })).catch(err => handleError(res, 500, err));
}

// Gets a single Job from the DB
export function show(req, res) {
  const fl = req.query.fl || [
    'id', 'role', 'owner_id', 'max_sal', 'min_sal', 'job_code', 'min_exp', 'max_exp',
    'client_name', 'job_status', 'job_status_id', 'required_skills', 'optional_skills',
    'interview_addr', 'interview_place_direction', 'days_per_week', 'job_location',
    'end_work_time', 'start_work_time', 'degrees', 'institutes', '_root_', 'vacancy',
    'employers', 'industries', 'perks', 'preferred_genders', 'responsibility',
  ].join(',');

  const solrQuery = db.Solr
    .createQuery()
    .q(`id:${req.params.jobId} AND type_s:job `)// AND (owner_id:${req.user.id}${following})
    .fl(fl);


  db.Solr.get('select', solrQuery, (err, result) => {
    if (err) return handleError(res, 500, err);
    const job = result.response.docs;
    const clientAttr = [
      'id', 'description', 'reg_address', 'min_emp', 'max_emp', 'website',
      'apple_store_link', 'playstore_link', 'windows_store_link',
    ];
    // @todo handle error from components/error
    if (!job.length) return handleError(res, 404, new Error('Job not found'));

    let promise;
    if (~fl.indexOf('_root_')) {
      promise = db.User.findById(job[0].owner_id).then(hr => db.Client.findById(hr.client_id, {
        attributes: clientAttr,
        include: [db.Logo],
      }).then(clientModel => Promise.all([
        clientModel.getClientPayments({ attributes: ['isFixed', 'end_range'] }),
        clientModel.getClientPaymentDesignations({ attributes: ['isFixed', 'designation'] }),
      ]).then(prRe => {
        const clientPaymentsAll = prRe[0].concat(prRe[1]);
        const argClientPayments = clientPaymentsAll[0];

        const client = clientModel.toJSON();
        if (argClientPayments) {
          if (argClientPayments.end_range !== 'NA') { // from db.ClientPayment
            if (argClientPayments.isFixed === 1) {
              client.payment = 'Fixed Module - Standard';
            } else if (argClientPayments.isFixed === 2) {
              client.payment = 'Fixed Module - Customised';
            } else if (argClientPayments.isFixed === 3) {
              client.payment = '1% Module, No Replacement - Customised';
            } else { // isFixed 0
              client.payment = '1% Module, No Replacement - Standard';
            }
          } else if (argClientPayments.end_range === 'NA') {
            if (argClientPayments.isFixed === 4) { // from db.ClientPaymentDesignation
              client.payment = 'Designation wise Module - Fixed';
            } else {
              client.payment = 'Designation wise Module - EMI';
            }
          } else {
            client.payment = 'NA';
          }
        }

        const logo = new Buffer(client.Logo.logo).toString('base64');
        client.logo = `data:${client.Logo.mime};base64,${logo}`;
        job[0]._root_ = _.pick(client, clientAttr.concat(['logo', 'payment']));
        return job[0];
      })));
    } else {
      promise = Promise.resolve(job);
    }

    const options = {
      attributes: ['id'],
      where: {
        user_id: req.user.id, // consultant_id
        job_id: req.params.jobId,
        status: 1,
      },
      include: [{
        model: db.ConsultantResponse,
        attributes: ['id', 'response_id'],
        required: false,
        where: {
          user_id: req.user.id, // consultant_id
        },
      }],
    };

    return Promise.all([
      promise,
      db.JobAllocation.find(options),
    ]).spread((gotJob, jobAlloc) => {
      const response = _.assign(
        { consultantAccepted: jobAlloc ? (jobAlloc.ConsultantResponse ? jobAlloc.ConsultantResponse.response_id === 1:false) : false },
        { allocationId: jobAlloc ? jobAlloc.id : false }
        , gotJob)
      return res.json(response);
    })
      .catch(rErr => handleError(res, 500, rErr));
  });
}

export function clientPayments(req, res) {
  db.Job.viewJobData(db, req.params.jobId)
    .then(jobDetails => db.ClientPayment.retrieveJobPayment(db, jobDetails)
    .then(resultData => res.json(resultData)))
    .catch(err => handleError(res, 500, err));
}

// To Insert a consultant response for a Particular Job
export function consultantResponse(req, res) {
  // 1 -> Accepted
  // 2 -> Hold
  // 3 -> Rejected
  const consultantResponse1 = {
    job_id: req.params.jobId,
    user_id: req.user.id, // need to handle
    response_id: req.body.responseId,
  };

  ConsultantResponse.create(consultantResponse1)
    .then(savedConsultantResponse => {
      const genereatedResponseId = savedConsultantResponse.id;
      return JobAllocation.find({
        where: {
          job_id: req.params.jobId,
          user_id: req.user.id,
        },
      })
        .then(jA => jA.update({ consultant_response_id: genereatedResponseId })
        .then(uJA => res.json(_.pick(uJA, ['id']))));
    }).catch(err => handleError(res, 500, err));
}

