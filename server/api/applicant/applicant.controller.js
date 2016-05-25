/**
 * Using Rails-like standard naming convention for endpoints.
 * GET     /api/applicants              ->  index
 * POST    /api/applicants              ->  create
 * GET     /api/applicants/:id          ->  show
 * PUT     /api/applicants/:id          ->  update
 * DELETE  /api/applicants/:id          ->  destroy
 */

import _ from 'lodash';
import fs from 'fs';
import moment from 'moment';
import db, { Applicant, Resume, Solr, Job, JobApplication, User, Client,
  STAKEHOLDERS, BUCKETS } from '../../sqldb';
import config from './../../config/environment';
import logger from './../../components/logger';


function handleError(res, statusCode, err) {
  logger.error(err);
  const status = statusCode || 500;
  res.status(status).send(err);
}

function wildSearch(argCllection, argKeywords) {
  let collection = argCllection;
  let keywords = argKeywords;
  if (keywords) {
    keywords = keywords.toUpperCase().split(' ');
    _.each(keywords, keyWord => {
      collection = _.filter(collection, item => Object.keys(item).some(key => {
        if (item.hasOwnProperty(key) && !(key.indexOf('$$hashKey') > -1)) {
          if (typeof item[key] === 'string' && item[key].toUpperCase().indexOf(keyWord) > -1) {
            return true;
          }
        }
        return false;
      }));
    });
  }
  return collection;
}

// Gets a list of UserJobApplicants
export function index(req, res) {
  const offset = req.query.offset || 0;
  const limit = (req.query.limit > 20) ? 20 : req.query.limit || 10;
  const fl = req.query.fl || [
    'id', 'name', 'exp_designation', 'edu_degree', 'exp_salary', 'client_name',
    'exp_employer', 'total_exp', 'exp_location', 'state_id',
    'state_name', 'applicant_score', 'created_on',
  ].join(',');

  const rawStates = (req.query.status) ? req.query.status.split(',') : ['ALL'];
  const bucket = BUCKETS[STAKEHOLDERS[req.user.group_id]];
  const states = [];
  rawStates.forEach((state, sIndex) => {
    // add weight to each state depending on positon in state array
    if (isNaN(state) && bucket[state]) {
      const bucketLength = bucket[state].length;
      bucket[state].forEach((s, i) => states.push(`${s}^=${bucketLength - i}`));
    }
    const rawStateLength = rawStates.length;
    if (_.isInteger(state) || ~bucket.ALL.indexOf(Number(state))) {
      states.push(`${state}^=${rawStateLength - sIndex}`);
    }
  });

  const solrQuery = Solr.createQuery()
    .q(`state_id:(${states.map(s => s).join(' ')})`)
    .matchFilter(
      encodeURIComponent('type_s'),
      `applicant AND (owner_id:${req.user.id})`
    );

  if (!req.query.q) {
    solrQuery.start(offset)
      .rows(limit);
  } else {
    // Todo: Research and correct overall collection search,
    solrQuery.start(0)
      .rows(5000);
  }

  solrQuery.fl(fl);

  if (req.query.interview_time) {
    solrQuery.rangeFilter([
      {
        field: 'interview_time',
        start: req.query.interview_time.split(',')[0] || '*',
        end: req.query.interview_time.split(',')[1] || '*',
      },
    ]);
  }
  Solr.get('select', solrQuery, (err, result) => {
    if (err) return res.status(500).json(err);
    let applicants = result.response.docs;
    if (!applicants.length) return res.json(applicants);
    if (!~fl.indexOf('_root_')) return res.json(applicants);

    const solrInnerQuery = db.Solr
      .createQuery()
      .q(`id:(${(_.uniq(applicants.map(a => a._root_))).join(' OR ')}) AND type_s:job`)
      .fl(['role', 'id', 'client_name', 'job_status'])
      .rows(applicants.length);

    // Get job to attach to results
    return db.Solr.get('select', solrInnerQuery, (jobErr, jobResult) => {
      if (jobErr) return handleError(res, 500, jobErr);
      const jobs = jobResult.response.docs;
      if (!jobs.length) res.json(applicants);
      applicants.forEach((applicant, key) => {
        applicants[key]._root_ = jobs
          .filter(s => s.id === applicants[key]._root_)[0];
      });
      if (!!req.query.q) {
        applicants.forEach((applicant, key) => {
          applicants[key].client_name = applicants[key]._root_.client_name;
          applicants[key].role = applicants[key]._root_.role;
        });
        applicants = wildSearch(applicants, req.query.q);
      }
      return res.json(applicants);
    });
  });
}

// bulkResumeDownload For Applicant
export function bulkResumeDownload(req, res) {
  Resume
    .findAll({
      attributes: [['applicant_id', 'name'], 'path'],
      where: {
        applicant_id: req.query.ids.split(','),
      },
    })
    .then((resumeModels) => {
      const concat = req.query.concat === 'true';
      const resumes = resumeModels.map(resume => {
        let path = `${config.QDMS_PATH}${resume.path}`;
        if (concat) {
          path = `${path.substring(0, path.lastIndexOf('/') + 1)}concat.pdf`;
        }

        return {
          path,
          name: `${resume.get('name')}.pdf`,
        };
      });

      // Set zip file name
      let filename = req.query.id.split(',').join('_');
      filename = concat ? `${filename}_concat` : filename;
      res.zip(resumes, `${filename}.zip`);
    })
    .catch(err => handleError(res, 500, err));
}

// Gets a single Applicant from the DB
export function show(req, res) {
  const fl = req.query.fl || [
    'name', 'id', 'applicant_score', 'state_name', 'state_id',
    'email', 'total_exp', 'skills', 'edu_degree', 'exp_salary',
    'exp_designation', 'exp_employer', 'email', 'notice_period',
    'mobile', 'exp_location', 'expected_ctc',
  ].join(',');

  //  const states = BUCKETS[STAKEHOLDERS[req.user.group_id]].ALL;

  const solrQuery = Solr.createQuery()
    .q('type_s:applicant')
    .matchFilter('id', `${req.params.id}`)
    .fl(fl);

  Solr.get('select', solrQuery, (err, result) => {
    if (err) return handleError(res, 500, err);
    if (result.response.docs.length === 0) {
      return handleError(res, 404, new Error('Applicant Not Found'));
    }

    if (!~fl.indexOf('_root_')) return res.json(result.response.docs[0]);
    const applicant = result.response.docs[0];
    const solrInnerQuery = db.Solr
      .createQuery()
      .q(`id:${applicant._root_} AND type_s:job`)
      .fl(['role', 'id', 'client_name'])
      .rows(1);

    // Get job to attach to results
    return db.Solr.get('select', solrInnerQuery, (jobErr, jobResult) => {
      if (jobErr) return handleError(res, 500, jobErr);
      const job = jobResult.response.docs[0];
      if (!job) return res.json(applicant);
      applicant._root_ = job;
      return res.json(applicant);
    });
  });
}

export function getResume(req, res) {
  Resume
    .find({
      attributes: ['path'],
      where: { applicant_id: req.params.id },
      order: 'id DESC',
    })
    .then((resume) => {
      // const resumePath = Applicant.getPreferredPath(resume.path) Feature Concat Removed
      if (!!resume.path) {
        fs.readFile(`${config.QDMS_PATH}${resume.path}`, (err, resumeFile) => {
          if (err) {
            if (err.code === 'ENOENT') {
              const responseText = '<br><br><h1 style="text-align: center">' +
                'Please wait the file is under processing...</h1>';
              return res.send(responseText);
            }
          }

          if (err) return handleError(res, 500, err);
          res.contentType('application/pdf');
          return res.send(resumeFile);
        });
      }
    })
    .catch(err => handleError(res, 500, err));
}

export function downloadResume(req, res) {
  return JobApplication
    .find({
      where: { applicant_id: req.params.id },
      include: [
        {
          model: Applicant,
          attributes: ['name'],
          include: [
            {
              model: Resume,
              attributes: ['path'],
            },
          ],
        },
        {
          model: Job,
          attributes: ['role', 'user_id'],
        },
      ],
    })
    .then(jobApplication => User.findOne({
      where: { id: jobApplication.Job.get('user_id') },
      include: [
        {
          model: Client,
          attributes: ['name'],
        },
      ],
    })
    .then((user) => {
      const file = {
        path: `${config.QDMS_PATH}${jobApplication.Applicant.Resumes[0].get('path')}`,
        name: `${jobApplication.Applicant.get('name')}-${jobApplication.Job.get('role')}` +
        `-${user.Client.get('name')}_${moment().format('D-MM-YY')}`,
      };
      if (req.query.concat === 'true') {
        file.path = `${file.path
          .substring(0, file.path.lastIndexOf('/') + 1)}-concat.pdf`;
        file.name += '_concat';
      }

      file.name = `${file.name.split(' ').join('_')}.pdf`;
      res.download(file.path, file.name);
    }))
    .catch(err => handleError(res, 500, err));
}

exports.changeState = function changeState(req, res) {
  // @todo Need to check eligibility of entity sending this post request
  // @todo Need to add applicant state id in applicant table
  db.ApplicantState
    .build(req.body)
    .set('user_id', req.user.id)
    .set('applicant_id', req.params.id)
    .save()
    .then(model => {
      res.status(204).end();

      // update applicant table
      db.Applicant.find({
        where: { id: model.applicant_id },
      }).then((applicant) => {
        applicant.update({ applicant_state_id: model.id });
      });

      // @todo applicant comment uses same logic => refactor
      Promise.all([

          // j[0] => jobApplicant
        db.JobApplication.findOne({
          where: { applicant_id: model.applicant_id },
          attributes: ['job_id'],
          include: [
            {
              model: db.Applicant,
              attributes: ['name', 'user_id'],
            },
            {
              model: db.Job,
              attributes: ['role', 'user_id'],
            },
          ],
        }),

          // j[0] => state.name
        db.State.findById(model.state_id, { attributes: ['name'] }),
      ])
        .then(j => {
          // j => jobApplication
          // Update solr indexes
          db.ApplicantState.updateSolr(db.Solr, {
            job: { id: j[0].job_id }, applicant: { id: model.applicant_id },
            state: _.assign({ state_name: j[1].name }, model.toJSON()),
          });

          db.User.findAll({

              // get applicant and job related fields
            where: { id: [j[0].Applicant.user_id, j[0].Job.user_id] },
            attributes: ['id', 'name'],
            include: [
              {
                  // Get Consultant and Recruiter Clients
                model: db.Client,
                attributes: ['name'],
                include: [
                  {
                      // Get engagement manager emails
                    model: db.User,
                    as: 'EngagementManager',
                    attributes: ['email_id'],
                  },
                ],
              },
            ],
          })
            .then(user => {
              const server = 'app.quezx.com';
              const state = { name: j[1].name, comment: model.comment };
              const job = {
                id: j[0].job_id,
                role: j[0].Job.role,
                creator: user.find(u => u.id === j[0].Job.user_id),
              };
              const applicant = {
                id: model.applicant_id, name: j[0].Applicant.name,
                creator: user.find(u => u.id === j[0].Applicant.user_id),
              };

              // add notification for user
              user.map(u => db.Notification
                  .build({ user_id: u.id })
                  .changeStateNotify({ state, applicant, job, server }));

              // Notify job recruiter EM
              db.QueuedTask.changeStateNotify({
                state, applicant, job, server,
                email: job.creator.Client.EngagementManager.email_id,
              });
            })
            .catch(err => handleError(res, 500, err));
        });

      db.QueuedTask.postChangeStateActions(model);
    })
    .catch(err => handleError(res, 500, err));
};

