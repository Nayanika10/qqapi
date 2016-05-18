/**
 * Using Rails-like standard naming convention for endpoints.
 * GET     /api/clients              ->  index
 * POST    /api/clients              ->  create
 * GET     /api/clients/:id          ->  show
 * PUT     /api/clients/:id          ->  update
 * DELETE  /api/clients/:id          ->  destroy
 */

import _ from 'lodash';
import moment from 'moment';
import path from 'canonical-path';
import fs from 'fs';
import handlebars from 'handlebars';
import wkhtmltopdf from 'wkhtmltopdf';
import db, { Client, Applicant, Job, JobApplication, ApplicantState, State, Func, Solr, User,
  JobAllocation, Industry, ClientPreferredFunction, ClientPreferredIndustry,
  QueuedTask } from '../../sqldb';
import config from './../../config/environment';
import phpSerialize from './../../components/php-serialize';
import logger from './../../components/logger';
import mkdirp from 'mkdirp-then';


function handleError(res, argStatusCode, err) {
  logger.error(err);
  const statusCode = argStatusCode || 500;
  res.status(statusCode).send(err);
}

export function makeUserActive(req, res) {
  // get your data into a variable
  User.find({
    where: {
      id: req.user.id,
    },
    attributes: ['id', 'name', 'email_id', 'timestamp'],
    include: {
      model: Client,
      attributes: ['name', 'perc_revenue_share', 'reg_address'],
    },
  })
  .then(user => {
    const clientData = {
      current_date: moment().format('Do MMMM YYYY'),
      company_name: user.Client.get('name'),
      perc_revenue_share: user.Client.get('perc_revenue_share'),
      company_address: user.Client.get('reg_address'),
    };
    const options = {
      pageSize: 'A4',
      encoding: 'UTF-8',
      'no-print-media-type': true,
      outline: true,
      dpi: 300,
      'margin-bottom': 0,
      'margin-left': 5,
      'margin-right': 5,
      'margin-top': 5,
    };
    // set up your handlebars template
    fs.readFile(path.join(config.root, 'server', 'views', 'terms-and-condition-pdf.html'), 'utf8',
      (err, data) => {
        if (err) {
          return res.json(err);
        }
        // compile the template
        const template = handlebars.compile(data.replace(/\n|\r/g, ''));
        // call template as a function, passing in your data as the context
        const outputString = template(clientData);
        // TODO GENERATE HTML FOR FRONTEND
        return mkdirp(`${config.QDMS_PATH}SignUps`).then(() => {
          wkhtmltopdf(outputString, options)
            .pipe(fs.createWriteStream(`${config.QDMS_PATH}SignUps/${req.user.id}.pdf`));
          // Sending mail to user with attachement of file using queue
          const queueData = phpSerialize.serialize({
            settings: {
              subject: 'QuezX.com | Acceptance of Terms & Conditions',
              to: user.dataValues.email_id,
              bcc: 'agreement@quetzal.in',
              from: ['notifications@quezx.com', 'QuezX.com'],
              domain: 'Quezx.com',
              emailFormat: 'html',
              template: ['SignupConsultantEmail'],
              attachments: [
                {
                  'terms_and_condition.pdf': `${config.QDMS_PATH}SignUps/${req.user.id}.pdf`,
                },
              ],
            },
            vars: {
              consultantName: user.dataValues.Client.name,
            },
          });
          const task = {
            jobType: 'Email',
            group: 'low',
            data: queueData,
          };
          // Creating entry in queued task Ends here
          QueuedTask.create(task)
            .catch(qErr => logger.error(`error queue email: user signup: ${req.user.id}`,
              qErr, queueData));
          // Updating user is_active flag and setting it to 1
          return User.find({
            where: {
              id: req.user.id,
            },
          }).then(quser => quser.update({
            is_active: 1,
          }));
        });
      });
    return res.json(user);
  })
    .catch(err => handleError(res, 500, err));
}

export function agreement(req, res) {
  // get your data into a variable
  User.find({
    where: {
      id: req.user.id,
    },
    attributes: ['id', 'name', 'email_id', 'timestamp'],
    include: {
      model: Client,
      attributes: ['name', 'perc_revenue_share', 'reg_address'],
    },
  })
  .then(user => {
    const clientData = {
      current_date: moment().format('Do MMMM YYYY'),
      company_name: user.dataValues.Client.name,
      perc_revenue_share: user.dataValues.Client.perc_revenue_share,
      company_address: user.dataValues.Client.reg_address,
    };
    // set up your handlebars template

    fs.readFile(path.join(config.root, 'server', 'views', 'terms-and-conditions.html'), 'utf8',
      (err, data) => {
        if (err) {
          return res.json(err);
        }
        // compile the template
        const template = handlebars.compile(data.replace(/\n|\r/g, ''));
        // call template as a function, passing in your data as the context
        const outputString = template(clientData);
        return res.end(outputString);
      });
  })
  .catch(err => handleError(res, 500, err));
}

// To get preferences of the consultant
export function checkTerminationStatus(req, res) {
  const clientId = req.user.client_id;
  Client.getTerminatedStatus(db, clientId)
    .then(response => res.json({ response }))
    .catch(err => res.json({ err }));
}
// TODO To be moved to config file
const ENUM = {
  CTC_RANGES: [{ min: 0, max: 3 }, { min: 3, max: 6 }, { min: 6, max: 10 }, { min: 10, max: 15 },
    { min: 15, max: 20 }, { min: 20, max: 30 }, { min: 30, max: 10000 }],
};

export function preferences(req, res) {
  const clientId = req.user.client_id;
  const clientDataPromise = Client.find({
    where: {
      id: req.user.client_id,
    },
    attributes: ['id', 'name', 'termination_flag', 'perc_revenue_share', 'consultant_survey',
      'bd_mgr_id', 'eng_mgr_id', 'min_ctc', 'max_ctc'],
  });

  return Promise.all([
    clientDataPromise,
    Func.getFunctionList(db),
    ClientPreferredFunction.getClientPreferredFunctionList(db, clientId),
    Industry.getIndustryList(db),
    ClientPreferredIndustry.getClientPreferredIndustryList(db, clientId),
  ]).then(promiseReturns => {
    const allApplicants = {};
    const clientData = promiseReturns[0];
    allApplicants.functionList = promiseReturns[1];
    const preferredFunctionList = promiseReturns[2];
    allApplicants.industryList = promiseReturns[3];
    const preferredIndustryList = promiseReturns[4];

    const preferredFunctionListIds = _.map(preferredFunctionList, 'func_id');
    allApplicants.functionList.map((item) => {
      const itemTemp = item.toJSON();
      const status = preferredFunctionListIds.indexOf(item.id);
      itemTemp.selected = (status !== -1);
      return itemTemp;
    });

    const preferredIndustryListIds = _.map(preferredIndustryList, 'industry_id');
    allApplicants.industryList.map((item) => {
      const itemTemp = item.toJSON();
      const status = preferredIndustryListIds.indexOf(item.id);
      itemTemp.selected = (status !== -1);
      return itemTemp;
    });

    const ctcRange = [clientData.min_ctc, clientData.max_ctc];
    allApplicants.ctcRange = ENUM.CTC_RANGES.map(item => {
      const itemTemp = item;
      itemTemp.selected = (itemTemp.min >= ctcRange[0] && itemTemp.max <= ctcRange[1]);
      return itemTemp;
    });
    return res.json(allApplicants);
  }).catch(err => res.json(err));
}


export function updatePreferences(req, res) {
  let ctcRange = _.filter(req.body.ctcRange, { selected: true }); // req.body.ctcRange
  ctcRange = _.sortBy(_.filter(ctcRange, { selected: true }), 'min'); // req.body.ctcRange
  const minCTC = ctcRange[0].min;
  const maxCTC = ctcRange[ctcRange.length - 1].max;
  const consultantSurveyTime = Date.now();
  const consultantSurvey = 1;

  return Client.find({
    where: {
      id: req.user.client_id,
    },
  }).then(client => client.update({
    min_ctc: minCTC,
    max_ctc: maxCTC,
    consultant_survey_time: consultantSurveyTime,
    consultant_survey: consultantSurvey,
  }).then(() => {
    const functionListToSave = _.filter(req.body.functionList, { selected: true });
    const clientPreferredFunctionData = functionListToSave
      .map(item => {
        const temp = { client_id: req.user.client_id, func_id: item.id };
        return temp;
      });

    const industryListToSave = _.filter(req.body.industryList, { selected: true });
    const clientPreferredIndustryData = industryListToSave
      .map(item => {
        const temp = { client_id: req.user.client_id, industry_id: item.id };
        return temp;
      });

    return Promise.all([
        (req.user.client_id ? ClientPreferredFunction
          .destroy({ where: { client_id: req.user.client_id } }) : []),
        (req.user.client_id ? ClientPreferredIndustry
          .destroy({ where: { client_id: req.user.client_id } }) : []),
    ])
    .then(() => Promise.all([
      // Inserting Client Preferred Function
      ClientPreferredFunction.bulkCreate(clientPreferredFunctionData),
      // Inserting Client Preferred Industry
      ClientPreferredIndustry.bulkCreate(clientPreferredIndustryData),
    ]).then(() => res.json({ message: 'record updated' })));
  }))
  .catch(err => handleError(res, 500, err));
}

export function actionCounts(req, res) {
  Applicant
    .findAll({
      where: {
        user_id: req.user.id,
      },
      attributes: ['id'],
      include: [
        {
          model: ApplicantState,
          attributes: [],
          where: {
            state_id: [6, 22, 32, 33],
          },
          include: {
            model: State,
            attributes: ['name'],
            where: {
              id: [6, 22, 32, 33],
            },
          },
        },
      ],
      raw: true,
    })
    .then(allApplicants => {
      const allApplicantsTemp = allApplicants;
      // Getting count applicant ids wrt state ids
      const _count = _.countBy(_.map(allApplicantsTemp, 'ApplicantState.State.id'));
      // extracting applicant ids from result data which is used later to fetch data from query
      const countData = [];
      Object.keys(_count).forEach(id => {
        const widgetItem = {};
        widgetItem.id = id;
        widgetItem.name = _.get(_.filter(allApplicantsTemp,
          { 'ApplicantState.State.id': parseInt(id, 10) })[0], 'ApplicantState.State.name');
        widgetItem.count = _count[id];
        countData.push(widgetItem);
      });

      res.json(countData);
    })
    .catch(err => handleError(res, 500, err));
}


export function ratingAndRatios(req, res) {
  const screeningDataPromise = Applicant.count({
    where: {
      user_id: req.user.id,
    },
    attributes: ['id'],
    include: [
      {
        model: ApplicantState,
        attributes: [],
        where: {
          state_id: [1, 2, 3, 4, 5, 8, 9, 10, 11, 12, 14, 15, 16, 17, 18, 19, 20, 21, 22,
            23, 24, 25, 28, 29, 30, 31, 33, 34, 35, 36, 38],
        },
        include: {
          model: State,
          attributes: ['name'],
        },
      },
    ],
    raw: true,
  });

  const screeningAllDataPromise = Applicant.count({
    where: {
      user_id: req.user.id,
    },
    attributes: ['id'],
    include: [
      {
        model: ApplicantState,
        attributes: [],
        where: {
          state_id: [1, 2, 3, 4, 5, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
            21, 22, 23, 24, 25, 28, 29, 30, 31, 33, 34, 35, 36, 38],
        },
        include: {
          model: State,
          attributes: ['name'],
        },
      },
    ],
    raw: true,
  });

  // Calculating shortlisting ratio
  const shortlistingDataPromise = Applicant.count({
    where: {
      user_id: req.user.id,
    },
    attributes: ['id'],
    include: [
      {
        model: ApplicantState,
        attributes: [],
        where: {
          state_id: [4, 5, 8, 9, 10, 11, 12, 15, 17, 18, 19, 20, 21, 22, 23, 24, 25, 28,
            29, 30, 31, 33, 34, 35, 36, 38],
        },
        include: {
          model: State,
          attributes: ['name'],
        },
      },
    ],
    raw: true,
  });

  const shortlistingAllDataPromise = Applicant.count({
    where: {
      user_id: req.user.id,
    },
    attributes: ['id'],
    include: [
      {
        model: ApplicantState,
        attributes: [],
        where: {
          state_id: [2, 3, 4, 5, 8, 9, 10, 11, 12, 15, 17, 18, 19, 20, 21, 22, 23,
            24, 25, 28, 29, 30, 31, 33, 34, 35, 36, 38],
        },
        include: {
          model: State,
          attributes: ['name'],
        },
      },
    ],
    raw: true,
  });

  return Promise.all([screeningDataPromise, screeningAllDataPromise,
      shortlistingDataPromise, shortlistingAllDataPromise])
    .then(promiseReturns => {
      const screeningRatio = Math.round((promiseReturns[0] / promiseReturns[1]) * 100);
      const shortlistingRatio = Math.round((promiseReturns[2] / promiseReturns[3]) * 100);
      const rating = (screeningRatio + shortlistingRatio) / 200 * 5;
      res.json({ screeningRatio, shortlistingRatio, rating });
    })
    .catch(err => handleError(res, 500, err));
}


export function forActions(req, res) {
  Applicant
    .findAll({
      where: {
        user_id: req.user.id,
      },
      attributes: ['id'],
      include: [
        {
          model: ApplicantState,
          attributes: [],
          where: {
            state_id: [6, 22, 32, 33],
          },
          include: {
            model: State,
            attributes: ['name'],
            where: {
              id: [6, 22, 32, 33],
            },
          },
        },
      ],
      raw: true,
    })
    .then(allApplicants => {
      const allApplicantsTemp = allApplicants;
      const _applicantIds = _.map(allApplicantsTemp, 'id');

      const solrQuery = Solr.createQuery()
        .q('type_s:applicant')
        .fl('id,name,mobile,email,state_name,exp_designation,exp_employer,_root_')
        .matchFilter('id', `(${_applicantIds.join(' ')})`)
        .rows(100);

      Solr.get('select', solrQuery, (err, result) => {
        if (err) return handleError(res, 500, err);
        const applicants = result.response.docs;
        if (!allApplicantsTemp.length) return res.json(applicants);
        const solrInnerQuery = db.Solr.createQuery()
          .q(`id:(${applicants.map(a => a._root_).join(' OR ')}) AND type_s:job`)
          .fl(['role', 'id', 'client_name'])
          .rows(100);

        // Get job to attach to results
        return db.Solr.get('select', solrInnerQuery, (jobErr, jobResult) => {
          if (jobErr) return handleError(res, 500, jobErr);
          const jobs = jobResult.response.docs;
          if (jobs.length) {
            applicants.forEach((applicant, key) => {
              applicants[key]._root_ = jobs
                .filter(s => s.id === applicants[key]._root_)[0];
            });
          }
          return res.json(applicants);
        });
      });
    })
    .catch(err => handleError(res, 500, err));
}

export function upcomingOffers(req, res) {
  Applicant.findAll({
    where: {
      user_id: req.user.id,
    },
    attributes: ['id', 'name'],
    include: [
      {
        model: ApplicantState,
        attributes: ['id', 'suggested_join_date'],
        where: {
          state_id: [10, 20],
          suggested_join_date: {
            $gte: moment().startOf('day').format('YYYY-MM-DD H:m:s'),
          },
        },
        include: {
          model: State,
          attributes: ['name'],
        },
      },
      {
        model: JobApplication,
        attributes: ['id'],
        include: [{
          model: Job,
          attributes: ['id', 'role', 'user_id'],
        }],
      },
    ],
    raw: true,
  }).then(upcomingOfferApplicants => {
    const _userIds = _.uniq(_.map(upcomingOfferApplicants, 'JobApplications.Job.user_id'));
    if (!_userIds.length) return res.status(204).json([]);
    return User.findAll({
      where: {
        id: _userIds,
      },
      attributes: ['id'],
      include: {
        model: Client,
        attributes: ['id', 'name'],
      },
    }).then(_userData => {
      const upcomingOfferData = upcomingOfferApplicants.map((applicant) => {
        const userId = _.get(applicant, 'JobApplications.Job.user_id');
        return {
          id: _.get(applicant, 'id'),
          name: _.get(applicant, 'name'),
          stateId: _.get(applicant, 'ApplicantState.State.id'),
          stateName: _.get(applicant, 'ApplicantState.State.name'),
          jobId: _.get(applicant, 'JobApplications.Job.id'),
          jobRole: _.get(applicant, 'JobApplications.Job.role'),
          jobClientId: userId,
          jobClientName: _.get(_.filter(
            _userData, user => user.id === userId)[0], 'Client.name'),
          joinDate: moment(_.get(applicant, 'ApplicantState.suggested_join_date'))
            .format('D/MM/YYYY'),
        };
      });
      return res.json(upcomingOfferData);
    });
  });
}

export function upcomingInterviews(req, res) {
  let fl = 'id,name,mobile,email,interview_type,interview_time,state_name,';
  fl += 'exp_designation,exp_employer,_root_';
  const solrQuery = Solr.createQuery()
    .q('type_s:applicant')
    .fl(fl)
    .matchFilter('state_id', `(5 8 17) AND owner_id:${req.user.id}`)
    .rangeFilter([
      {
        field: 'interview_time',
        start: moment().startOf('day').toISOString(),
        end: moment().endOf('week').toISOString(),
      },
    ])
    .sort('interview_time', 'ASC')
    .rows(100);
  Solr.get('select', solrQuery, (err, result) => {
    if (err) return handleError(res, 500, err);
    const applicants = result.response.docs;
    if (!applicants.length) return res.json(applicants);
    const solrInnerQuery = db.Solr.createQuery()
      .q(`id:(${applicants.map(a => a._root_).join(' OR ')}) AND type_s:job`)
      .fl(['role', 'id', 'client_name'])
      .rows(100);

    // Get job to attach to results
    return db.Solr.get('select', solrInnerQuery, (jobErr, jobResult) => {
      if (jobErr) return handleError(res, 500, jobErr);
      const jobs = jobResult.response.docs;
      if (jobs.length) {
        applicants.forEach((applicant, key) => {
          applicants[key]._root_ = jobs
            .filter(s => s.id === applicants[key]._root_)[0];
        });
      }
      return res.json(applicants);
    });
  });
}

export function latestProfiles(req, res) {
  return JobAllocation.findAll({
    where: {
      user_id: req.user.id,
      created_on: {
        $gte: moment().startOf('day').format('YYYY-MM-DD H:m:s'),
      },
    },
    attributes: ['job_id', 'created_on'],
    raw: true,
  }).then(newProfiles => {
    if (newProfiles.length !== 0) {
      const solrQuery2 = Solr.createQuery()
        .q('type_s:job')
        .fl('id,role,min_sal,max_sal,job_location,client_name')
        .matchFilter('id', `(${_.map(newProfiles, 'job_id').join(' ')})`);

      Solr.getAsync('select', solrQuery2)
        .then((allApplicantsJobs) => {
          let newProfileData = allApplicantsJobs.response.docs;
          newProfileData = newProfileData.map(data => {
            const profile = { id: data.id, jobLocation: data.job_location,
              role: data.role, client_name: data.client_name };
            if (typeof data.max_sal !== undefined && typeof data.min_sal !== undefined) {
              if (data.max_sal) {
                profile.salaryRange = `${data.min_sal}-${data.max_sal} Lakhs`;
              }
            }
            return profile;
          });
          res.json(newProfileData);
        });
    } else {
      res.json([]);
    }
  })
  .catch(err => handleError(res, 500, err));
}

export function billing(req, res) {
  Client
    .find({
      where: {
        id: req.user.client_id
      },
      attributes: ['id',
        'company_reg_name',
        'reg_address',
        'bank_name',
        'branch',
        'account_type',
        'account_number',
        'ifsc',
        'micr',
        'pan_verified',
        'tan_verified',
        'pan_number',
        'tan_number',
        'service_tax_enabled',
        'service_tax_reg_number',
        'msmed_enabled',
        'msmed_number',
        'org_size'
      ]
    })
    .then(client => {
      return res.json(client);
    })
    .catch(err => handleError(res, 500, err));
}
var img;
export function company(req, res) {
  Client
    .find({
      where: {
        id: req.user.client_id
      },
      attributes: ['id',
        'name',
        'corp_address',
        'entity_type_id',
        'description',
        'short_description',
        'min_emp',
        'max_emp',
        'website',
        'logo_id',
        'cin_id',
        'llp_id'
      ],
      include: {
        model: db.Logo,
        attributes: ['logo', 'mime']
      },
    })
    .then(clientData => {
      const client = clientData.toJSON();
      let logo = new Buffer(client.Logo.logo).toString('base64');
      client.logo = {
        base64: logo,
        filetype: client.Logo.mime
      };
      img = logo
      delete client.Logo;
      return res.json(client);
    })
    .catch(err => handleError(res, 500, err));
}

export function profile(req, res) {
  User
    .find({
      where: {
        id: req.user.id
      },
      attributes: ['id',
        'name',
        'client_id',
        'username',
        'firstname',
        'lastname',
        'number',
        'email_id',
        'timestamp',
        'admin_flag'
      ]
    })
    .then(client => {
      return res.json(client);
    })
    .catch(err => handleError(res, 500, err));
}

export function profileUpdate(req, res){
  const userProfile = _.pick(req.body, ['id','number','email_id']);
  User
    .findById(req.user.id)
    .then(user => {
      return user.update(userProfile).then(userPro => {
        const response = _.pick(userPro,['id']);
        response.message = 'Success';
        return res.json(response);
      })

    })
    .catch(err => handleError(res, 500, err));
}

export function companyUpdate(req, res){
  const companyData = _.pick(req.body, [
    'name', 'corp_address', 'entity_type_id', 'description', 'short_description', 'min_emp',
    'max_emp', 'website', 'logo_id', 'cin_id', 'llp_id'
  ]);

  const logoData = {
    logo: new Buffer(req.body.logo.base64, 'base64'),
    mime: req.body.logo.filetype
  };

  Client
    .findById(req.user.client_id)
    .then(client => {
      db.Logo.findById(client.logo_id)
        .then(logo => logo.update(logoData))
        .catch(logger.error);
      return client.update(companyData).then(clientPro => {
        const response = _.pick(clientPro,['id']);
        response.message = 'Success';
        return res.json(response);
      })

    })
    .catch(err => handleError(res, 500, err));
}

export function billingUpdate(req, res){
  const companyData = _.pick(req.body, [
    'company_reg_name', 'reg_address', 'bank_name', 'branch', 'account_type',
    'account_number', 'ifsc', 'micr', 'pan_verified', 'tan_verified', 'pan_number',
    'tan_number',
    'service_tax_enabled',
    'service_tax_reg_number',
    'msmed_enabled',
    'msmed_number',
    'org_size'
  ]);
  Client
    .findById(req.user.client_id)
    .then(client => {
      return client.update(companyData).then(clientPro => {
        const response = _.pick(clientPro,['id']);
        response.message = 'Success';
        return res.json(response);
      })
    })
    .catch(err => handleError(res, 500, err));
}
