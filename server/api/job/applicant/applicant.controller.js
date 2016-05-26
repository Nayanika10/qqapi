/**
 * Using Rails-like standard naming convention for endpoints.
 * GET     /api/jobs/              ->  index
 * POST    /api/jobs/              ->  create
 * GET     /api/jobs//:id          ->  show
 * PUT     /api/jobs//:id          ->  update
 * DELETE  /api/jobs//:id          ->  destroy
 */

import _ from 'lodash';
import path from 'canonical-path';
import formidable from 'formidable';
import db, { Applicant, Solr, STAKEHOLDERS, BUCKETS } from '../../../sqldb';
import config from './../../../config/environment';
import logger from './../../../components/logger';

function handleError(res, argStatusCode, err) {
  logger.error(err);
  const status = argStatusCode || 500;
  res.status(status).json(err);
}

// Gets a list of Applicants
export function index(req, res) {
  const offset = req.query.offset || 0;
  const limit = (req.query.limit > 20) ? 20 : req.query.limit || 10;
  const fl = req.query.fl || [
    'id', 'name', 'exp_designation', 'edu_degree', 'exp_salary',
    'exp_employer', 'total_exp', 'exp_location', 'state_id',
    'state_name', 'applicant_score', 'created_on',
  ].join(',');

  const rawStates = (req.query.status) ? req.query.status.split(',') : ['ALL'];
  const bucket = BUCKETS[STAKEHOLDERS[req.user.group_id]]; // stakeholder is 2|consultant 5|client

  let solrSelect = 'type_s=applicant';

  if (req.user.group_id === 2) { // if consultant
    solrSelect += `AND owner_id:${req.user.id} AND _root_:${req.params.jobId}`;
  }

  const states = [];
  rawStates.forEach(state => {
    if (isNaN(state)) if (bucket[state]) bucket[state].map(s => states.push(s));

    if (_.isInteger(state) || ~bucket.ALL.indexOf(Number(state))) states.push(Number(state));
  });


  const solrQuery = Solr.createQuery()
    .q(solrSelect)
    .fl(fl)
    .matchFilter('state_id', `(${states.join(' OR ')})`)
    .start(offset)
    .rows(limit);

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
    if (err) return handleError(res, 500, err);
    return res.json(result.response.docs);
  });
}

// Check Already Applied
export function alreadyApplied(req, res) {
  const jobId = req.params.jobId;
  return db.Applicant.alreadyApplied(db, jobId, req.query.email, req.query.number)
  .then(status => res.json(_.extend({ code: 409, message: 'phone or email conflict' }, status)))
    .catch(err => handleError(res, 500, err));
}

// Check Already Applied with applicantId
export function alreadyAppliedWithApplicantId(req, res) {
  const jobId = req.params.jobId;
  const email = req.query.email;
  const mobile = req.query.number;
  const applicantId = req.params.applicantId;
  Applicant.alreadyAppliedWithApplicantId(db, jobId, email, mobile, applicantId)
    .then(status => res.json(_.extend({ code: 409, message: 'phone or email conflict' }, status)))
    .catch(err => handleError(res, 500, err));
}

// Creates a new Applicant in the DB
export function create(req, res) {
  const form = new formidable.IncomingForm();
  form.parse(req, (formErr, fields, files) => {
    if (formErr) return handleError(res, 500, formErr);
    const applicant = JSON.parse(fields.payload);
    return Applicant.alreadyApplied(db, req.params.jobId, applicant.email_id, applicant.number)
      .then(status => {
        const message = 'Already candidate uploaded with this Phone or Email';
        if (status.email === true || status.number === true) {
          return res.status(409)
            .json(_.extend({ message }, status));
        }
        const file = files.fileUpload;
        const fileExt = file.name.split('.').pop(); // Extension
        const allowedExtType = ['doc', 'docx', 'pdf', 'rtf', 'txt'];

        if (allowedExtType.indexOf(fileExt.toLowerCase()) === -1) {
          return res.status(400)
            .json({ code: '400 Bad Request', message: 'File Type Not Allowed' });
        }
        return Applicant.saveApplicant(db, applicant, file, req.user.id, req.params.jobId)
          .then(savedApplicant => res.json(_.pick(savedApplicant, ['id'])));
      })
      .catch(err => handleError(res, 500, err));
  });
}

// Candidate Applying from apply.quezx
export function apply(req, res) {
  const form = new formidable.IncomingForm();
  form.parse(req, (formErr, fields, files) => {
    if (formErr) return handleError(res, 500, formErr);
    const applicant = JSON.parse(fields.payload);
    return Applicant.alreadyApplied(db, req.params.jobId, applicant.email_id, applicant.number)
      .then(status => {
        const message = 'Already candidate uploaded with this Phone or Email';
        if (status.email === true || status.number === true) {
          return res.status(409)
            .json(_.extend({ message }, status));
        }
        const file = files.fileUpload;
        const fileExt = file.name.split('.').pop(); // Extension
        const allowedExtType = ['doc', 'docx', 'pdf', 'rtf', 'txt'];

        if (allowedExtType.indexOf(fileExt.toLowerCase()) === -1) {
          return res.status(400)
            .json({ code: '400 Bad Request', message: 'File Type Not Allowed' });
        }
        const stateId = 42; // Pre Screening New
        return Applicant.saveApplicant(db, applicant, file, req.user.id, req.params.jobId, stateId)
          .then(savedApplicant => res.json(_.pick(savedApplicant, ['id'])));
      })
      .catch(err => handleError(res, 500, err));
  });
}


export function reapply(req, res) {
  const jobId = req.params.jobId;
  const applicantId = req.body.applicant_id;

  Applicant.findById(applicantId, {
    include: [db.Resume, db.Email, db.PhoneNumber, db.Education],
  }).then(applicant => {
    const email = _.get(applicant.Emails[0], 'email');
    const mobile = _.get(applicant.PhoneNumbers[0], 'number');
    return db.Applicant.alreadyApplied(db, jobId, email, mobile)
      .then(status => {
        if (status.email === true || status.number === true) {
          return res.status(409).json({ message: 'Already applied' });
        }
        const userId = req.user.id;
        const file = {
          name: applicant.Resumes[0] ? applicant.Resumes[0].path.split('/').pop() : '',
          path: config.QDMS_PATH + _.get(applicant.Resumes[0], 'path'),
        };

        const experiancePromise = db.Experience.find({
          where: { applicant_id: applicant.id },
          raw: true,
        }).then(experience => {
          const experiancePromises = [
            db.Region.findById(experience.region_id),
            db.Employer.findById(experience.employer_id),
            db.Designation.findById(experience.designation_id),
          ];

          return Promise.all(experiancePromises).then(resolvedPromise => {
            const region = resolvedPromise[0] || {};
            const employer = resolvedPromise[1] || {};
            const designation = resolvedPromise[2] || {};
            const _experience = experience;
            _experience.region = region.region;
            _experience.employer = employer.name;
            _experience.designation = designation.name;
            return _experience;
          });
        });

        return Promise.all([experiancePromise]).then(prRe => {
          const experience = prRe[0];
          const applicantToSave = {
            name: applicant.name,
            expected_ctc: applicant.expected_ctc,
            salary: experience.salary,
            notice_period: applicant.notice_period,
            total_exp: applicant.total_exp,
            number: applicant.PhoneNumbers[0].number,
            email_id: applicant.Emails[0].email,
            employer_id: experience.employer_id, // TODO: Table restructure
            designation_id: experience.designation_id,
            region_id: experience.region_id,
            degree_id: applicant.Education[0].degree_id,
          };

          return Applicant.saveApplicant(db, applicantToSave, file, userId, jobId)
            .then(savedApplicant => res.status(201)
              .json({ message: 'Approved', id: savedApplicant.id }));
        });
      });
  })
  .catch(err => handleError(res, 500, err));
}
export function show(req, res) {
  db.Applicant.getFullDetails(db, req.params.applicantId).then(applicant => {
    function getExperienceMonth(input) {
      let inputValue = input;
      if (typeof input === 'number') inputValue = inputValue.toString();
      if (!inputValue) return inputValue;
      const split = (`${inputValue}''`).split('.');
      let returnValue;
      if (split.length === 2) {
        const m = split[1];
        returnValue = parseInt(m[0] === '0' ? m[1] : m, 10);
      } else {
        returnValue = '';
      }
      return returnValue;
    }

    const resApplicant = {
      id: applicant.id,
      name: applicant.name,
      email_id: _.get(applicant.Emails[0], 'email'),
      number: _.get(applicant.PhoneNumbers[0], 'number'),
      expected_ctc: _.get(applicant, 'expected_ctc'),
      employer_id: _.get(applicant.Experience, 'employer_id'),
      designation_id: _.get(applicant.Experience, 'designation_id'),
      degree_id: _.get(applicant.Education[0], 'degree_id'),
      salary: _.get(applicant.Experience, 'salary'),
      notice_period: _.get(applicant, 'notice_period'),
      region_id: _.get(applicant.Experience, 'region_id'),
      total_exp: _.get(applicant, 'total_exp'),
      // Derived Fields
      region: _.get(applicant.Experience, 'region'),
      designation_name: _.get(applicant.Experience, 'designation'),
      employer_name: _.get(applicant.Experience, 'employer'),
      degree_name: _.get(applicant.Degree, 'degree'),
      total_exp_y: Math.round(_.get(applicant, 'total_exp')),
      total_exp_m: getExperienceMonth(_.get(applicant, 'total_exp')),
    };
    return res.json(resApplicant);
  }).catch(err => handleError(res, 500, err));
}


export function update(req, res) {
  db.Applicant.getFullDetails(db, req.params.applicantId).then(exApplicant => {
    if (db.BUCKETS.GROUPS.CONSULTANT === '2') {
      const editAllowedStates = [27, 6, 13, 32]; // 27:Scr Pend 6:SHold 13:SReject 32:SAttempt
      if (editAllowedStates.indexOf(exApplicant.state_id) === -1) {
        return res.status(400).json({ message: 'Currently editing CV not allowed' });
      }
    }
    let reqPr = [];
    if (req.get('Content-Type').search('json') === -1) {
      // Multipart
      reqPr = new Promise(
        (resolve, reject) => { // (A)
          const form = new formidable.IncomingForm();
          form.parse(req, (err, fields, files) => {
            if (err) return reject(err);
            return resolve({ body: JSON.parse(fields.payload), files });
          });
        });
    } else if (req.get('Content-Type').search('multipart') === -1) {
      // application/json
      reqPr = Promise.resolve({ body: req.body });
    } else {
      return res.json({});
    }

    return Promise.all([reqPr]).then(bodyPrRe => {
      const applicantData = bodyPrRe[0];
      const files = applicantData.files;
      const editedApplicant = applicantData.body;
      if (editedApplicant.id) {
        delete editedApplicant.id;
      }

      const jobId = req.params.jobId;
      const applicantId = req.params.applicantId;

      const promises = [];
      promises.push(db.Applicant.findById(exApplicant.id)
        .then(appl => appl.update(_.pick(editedApplicant,
          'name', 'expected_ctc', 'notice_period', 'total_exp'))));

      if (files) {
        const file = files.fileUpload;
        const fileExt = file.name.split('.').pop().toLowerCase(); // Extension
        const allowedExtType = ['doc', 'docx', 'pdf', 'rtf', 'txt'];
        if (allowedExtType.indexOf(fileExt.toLowerCase()) === -1) {
          return res.json({ code: '400 Bad Request', message: 'File Type Not Allowed' });
        }

        const resumePr = db.Resume.find({
          attributes: [
            'id',
            'applicant_id',
            'path',
          ],
          where: {
            applicant_id: applicantId,
          },
        }).then(resume => {
          if (!resume) return { message: 'Resume not found' };
          const existsingFilename = resume.path.split('/').pop();
          const newupdateIdArray = existsingFilename.split('.');
          const newID = parseInt(newupdateIdArray[0], 10) + 1;
          const rangeFolder = (applicantId - (applicantId % 10000)).toString();

          const folder = `${path.join(config.QDMS_PATH,
              'Applicants', rangeFolder, applicantId.toString())}/`;
          const resumePathToUpdateInDB = `${folder}${newID}.${fileExt}`;
          const tempFilePath = files.fileUpload.path;
          return db.Applicant.uploadFile(db, tempFilePath, folder, newID, fileExt, applicantId)
            .then(() => {
              db.Applicant.processApplicantCharactersticks(db, applicantId, jobId)
                .catch(logger.error);

              return resume.update({ path: resumePathToUpdateInDB });
            });
        });
        promises.push(resumePr);
      }

      if (!!editedApplicant.email_id &&
        _.get(exApplicant.Emails[0], 'email') !== editedApplicant.email_id) {
        promises.push(db.Email.findById(_.get(exApplicant.Emails[0], 'id'))
          .then(email => email.update({ email: editedApplicant.email_id })));
      }

      if (!!editedApplicant.number &&
        _.get(exApplicant.PhoneNumbers[0], 'number') !== editedApplicant.number) {
        promises.push(db.PhoneNumber.findById(_.get(exApplicant.PhoneNumbers[0], 'id'))
          .then(number => number.update({ number: editedApplicant.number })));
      }

      if (!!editedApplicant.degree_id &&
        _.get(exApplicant.Education[0], 'id') !== editedApplicant.degree_id) {
        promises.push(db.Education.findById(_.get(exApplicant.Education[0], 'id'))
          .then(education => education.update({ degree_id: editedApplicant.degree_id })));
      }

      const experienceToSave = {};

      if (!!editedApplicant.salary
        && _.get(exApplicant.Experience, 'salary') !== editedApplicant.salary) {
        experienceToSave.salary = editedApplicant.salary;
      }

      if (!!editedApplicant.region_id &&
        _.get(exApplicant.Experience, 'region_id') !== editedApplicant.region_id) {
        experienceToSave.region_id = editedApplicant.region_id;
      }

      if (!!editedApplicant.employer_id &&
        _.get(exApplicant.Experience, 'employer_id') !== editedApplicant.employer_id) {
        experienceToSave.employer_id = editedApplicant.employer_id;
      }

      if (!!editedApplicant.designation_id &&
        _.get(exApplicant.Experience, 'designation_id') !== editedApplicant.designation_id) {
        experienceToSave.designation_id = editedApplicant.designation_id;
      }

      if (Object.keys(experienceToSave).length) {
        promises.push(db.Experience.findById(_.get(exApplicant.Experience, 'id'))
          .then(exp => exp.update(experienceToSave)));
      }
      return Promise.all(promises).then(() => res.json({ id: exApplicant.id }));
    });
  }).catch(err => handleError(res, 500, err));
}
