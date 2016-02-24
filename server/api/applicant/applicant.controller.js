/**
 * Using Rails-like standard naming convention for endpoints.
 * GET     /api/applicants              ->  index
 * POST    /api/applicants              ->  create
 * GET     /api/applicants/:id          ->  show
 * PUT     /api/applicants/:id          ->  update
 * DELETE  /api/applicants/:id          ->  destroy
 */

'use strict';

import _ from 'lodash';
import {Applicant, Resume, ApplicantState, QueuedTask, Solr, Job, Email, PhoneNumber, Experience,
  JobApplication, ApplicantDownload, ApplicantSkill, User, Client } from '../../sqldb';
import buckets from './../../config/buckets';
import stakeholders from './../../config/stakeholders';
import phpSerialize from './../../components/php-serialize';
import config from './../../config/environment';
import util from 'util';
import formidable from 'formidable';
import fs from 'fs';
import mkdirp from 'mkdirp';
import moment from 'moment';


function handleError(res, statusCode, err) {
  statusCode = statusCode || 500;
  res.status(statusCode).send(err);
}

// Gets a list of UserJobApplicants
export function index(req, res) {
  const offset = req.query.offset || 0;
  const limit = (req.query.limit > 20) ? 20 : req.query.limit || 10;
  const fl = req.query.fl || [
      'id', 'name', 'exp_designation', 'edu_degree', 'exp_salary','client_name',
      'exp_employer', 'total_exp', 'exp_location', 'state_id',
      'state_name', 'applicant_score', 'created_on'
    ].join(',');

  const rawStates = (req.query.state_id) ? req.query.state_id.split(',') : ['ALL'];
  const bucket = buckets[stakeholders[req.user.group_id]];
  const states = [];
  rawStates.forEach(function normalize(state) {
    if (isNaN(state)) if (bucket[state]) bucket[state].map(s => states.push(s));

    if (_.isInteger(state) || ~bucket.ALL.indexOf(Number(state))) states.push(Number(state));
  });
  //var solrQuery = solr.createQuery().q('({!child of="type_s:job"}owner_id:' + clientId +
//      ') AND type_s:applicant AND ' + stateParam).fl(fl).sort({_root_: 'DESC', type_s: 'DESC'}).start(start).rows(rows);

  const solrQuery = Solr.createQuery()
    .q('(owner_id:' + req.user.id +') AND type_s:applicant ')
    // {!child of="type_s:job"}
    .sort({_root_: 'DESC', type_s: 'DESC'})
    .fl(fl)
    .matchFilter('state_id', `(${states.join(' OR ')})`)
    .start(offset)
    .rows(limit);

  if (req.query.interview_time) {
    solrQuery.rangeFilter([
      {
        field: 'interview_time',
        start: req.query.interview_time.split(',')[0] || '*',
        end: req.query.interview_time.split(',')[1] || '*'
      }
    ]);
  }
  Solr.get('select', solrQuery, function solrCallback(err, result) {
    if (err) return res.status(500).json(err);
    res.json(result.response.docs);
  });
}



// Gets a single Applicant from the DB
export function show(req, res) {
  const fl = req.query.fl || [
      'name', 'id', 'applicant_score', 'state_name', 'state_id',
      'email', 'total_exp', 'skills', 'edu_degree', 'exp_salary',
      'exp_designation', 'exp_employer', 'email', 'notice_period',
      'mobile', 'exp_location', 'expected_ctc',
    ].join(',');

  const states = buckets[stakeholders[req.user.group_id]].ALL;

  const solrQuery = Solr.createQuery()
    .q(` type_s:applicant`)
    //{!child of="type_s:job"} owner_id:${req.user.id} AND
    .matchFilter('state_id', `(${states.join(' OR ')})`)
    .matchFilter('id', `${req.params.id}`)
    .fl(fl);

  Solr.get('select', solrQuery, function solrCallback(err, result) {
    if (err) return handleError(res, 500,err);
    if (result.response.docs.length === 0) return handleError(res, 404,new Error('Applicant Not Found'));
    res.json(result.response.docs[0]);
  });
};



// Updates an existing Applicant in the DB
export function update(req, res) {
  if (req.body._id) {
    delete req.body._id;
  }
  Applicant.find({
      where: {
        _id: req.params.id
      }
    })
    .then(handleEntityNotFound(res))
    .then(saveUpdates(req.body))
    .then(respondWithResult(res))
    .catch(err => handleError(res,500,err));
}

// Deletes a Applicant from the DB
export function destroy(req, res) {
  Applicant.find({
      where: {
        id: req.params.id
      }
    })
    .then(handleEntityNotFound(res))
    .then(removeEntity(res))
    .catch(err => handleError(res,500,err));
}

export function getResume(req, res) {
  Resume
    .find({
      attributes: ['path'],
      where: { applicant_id: req.params.id },
    })
    .then(function formatFile(resume) {
      fs.readFile(`${config.QDMS_PATH}${resume.path}`, (err, resumeFile) => {
        if (err) return handleError(res, 500, err);
        res.contentType('application/pdf');
        res.send(resumeFile);
      });
    })
    .catch(err => handleError(res,500,err));
};

export function downloadResume(req, res) {
  JobApplication
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
    .then(function getClientInfo(jobApplication) {
      User.findOne({
          where: { id: jobApplication.Job.get('user_id') },
          include: [
            {
              model: Client,
              attributes: ['name'],
            },
          ],
        })
        .then(function sendResume(user) {
          const file = {
            path: `${config.QDMS_PATH}${jobApplication.Applicant.Resumes[0].get('path')}`,
            name: `${jobApplication.Applicant.get('name')}-${jobApplication.Job.get('role')}` +
            `-${user.Client.get('name')}_${moment().format('D-MM-YY')}`,
          };
          if (req.query.concat === 'true') {
            file.path = file.path
                .substring(0, file.path.lastIndexOf('/') + 1) + 'concat.pdf';
            file.name += '_concat';
          }

          file.name = `${file.name.split(' ').join('_')}.pdf`;
          res.download(file.path, file.name);
        })
        .catch(err => handleError(res,500,err));
    })
    .catch(err => handleError(res,500,err));
};

// Change State For Applicant
export function changeState(req, res){
  // @todo Need to check eligibility of entity sending this post request
  // @todo Need to add applicant state id in applicant table
  ApplicantState
    .build(req.body)
    .set('user_id', req.user.id)
    .set('applicant_id', req.params.id)
    .save()
    .then((model) => {

      const data = phpSerialize.serialize({
        command: `${config.quarcPath}app/Console/cake`,
        params: [
          'state_change_action',
          '-s', model.state_id,
          '-a', model.applicant_id,
          '-u', model.user_id,
        ],
      });
      const task = {
        jobType: 'Execute',
        group: 'high',
        data,
      };

      QueuedTask.create(task);
      res.status(201).end();
    })
    .catch(err => handleError(res,500,err));
}

