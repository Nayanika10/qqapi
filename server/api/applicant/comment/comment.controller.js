/**
 * Using Rails-like standard naming convention for endpoints.
 * GET     /api/applicants              ->  index
 * POST    /api/applicants              ->  create
 * GET     /api/applicants/:id          ->  show
 * PUT     /api/applicants/:id          ->  update
 * DELETE  /api/applicants/:id          ->  destroy
 */

import _ from 'lodash';
import db, { QueuedTask, Job, JobApplication, Comment, User, ApplicantState,
  BUCKETS, STAKEHOLDERS, InterviewFollowUp } from '../../../sqldb';
import logger from '../../../components/logger';

function handleError(res, argStatusCode, err) {
  const statusCode = argStatusCode || 500;
  res.status(statusCode).json(err);
}

// Gets a list of Comments
export function index(req, res) {
  switch (req.user.group_id) {
    case BUCKETS.GROUPS.INTERNAL_TEAM: {
      const commentsPromise = Comment.findAll({
        attributes: ['id', ['comment', 'body'], 'user_id', ['created_on', 'created_at']],
        order: [['id', 'DESC']],
        where: { applicant_id: req.params.applicantId },
      });
      const stateCommentsPromise = ApplicantState.findAll({
        attributes: [
          'id', 'state_id', 'user_id', ['updated_on', 'created_at'],
          'suggested_join_date', 'offered_ctc', 'final_ctc', 'scheduled_on',
          ['comments', 'body'], 'currency',
        ],
        order: [['id', 'DESC']],
        where: {
          applicant_id: req.params.applicantId,
          state_id: BUCKETS[STAKEHOLDERS[req.user.group_id]].ALL,
        },
        include: [{
          model: db.InterviewFollowUp,
          include: {
            model: db.FollowUpOption
          }
        },{
          model: db.State,
          include: [{
            model: db.FollowUpOption
          }]
        }]
      });
      Promise.all([commentsPromise, stateCommentsPromise])
        .then(val => {
          const comments = val[0]
            .map(c => c.toJSON())
            .concat(val[1].map(c => c.toJSON()));
          User.findAll({
            attributes: ['id', 'name', 'group_id'],
            where: {
              id: _.uniq(comments.map(c => c.user_id)),
            },
          })
          .then((userModels) => {
            comments.forEach((comment, iIndex) => {
              const user = userModels
                .filter(u => u.id === comment.user_id)[0];
              const tempUser = user.toJSON();
              if (BUCKETS.GROUPS.CONSULTANTS === req.user.group_id) {
                switch (tempUser.group_id) {
                  case 2: // if comment is from consultant then show his details
                  case 5: // if comment is from client then show client details
                    // Do nothing
                    break;
                  default: // any other case considered as Quezx Users
                    tempUser.name = 'QuezX';
                    break;
                }
              }
              // Customized commenter naming to be viewed by recruiter
              comments[iIndex].user = _.pick(user, ['id', 'name']);
            });
            res.json(comments);
          });
        })
        .catch(err => handleError(res, 500, err));
      break;
    }
    case BUCKETS.GROUPS.CONSULTANTS: {
      const commentsPromise = Comment.findAll({
        attributes: ['id', ['comment', 'body'], 'user_id', ['created_on', 'created_at']],
        order: [['id', 'DESC']],
        where: { applicant_id: req.params.applicantId },
      });
      const stateCommentsPromise = ApplicantState.findAll({
        attributes: [
          'id', 'state_id', 'user_id', ['updated_on', 'created_at'],
          'suggested_join_date', 'offered_ctc', 'final_ctc', 'scheduled_on',
          ['comments', 'body'], 'currency',
        ],
        order: [['id', 'DESC']],
        where: {
          applicant_id: req.params.applicantId,
          state_id: BUCKETS[STAKEHOLDERS[req.user.group_id]].ALL,
        },
      });
      Promise.all([commentsPromise, stateCommentsPromise])
        .then(val => {
          const comments = val[0]
            .map(c => c.toJSON())
            .concat(val[1].map(c => c.toJSON()));
          User.findAll({
            attributes: ['id', 'name', 'group_id'],
            where: {
              id: _.uniq(comments.map(c => c.user_id)),
            },
          })
            .then((userModels) => {
              comments.forEach((comment, iIndex) => {
                const user = userModels
                  .filter(u => u.id === comment.user_id)[0];
                const tempUser = user.toJSON();
                if (BUCKETS.GROUPS.CONSULTANTS === req.user.group_id) {
                  switch (tempUser.group_id) {
                    case 2: // if comment is from consultant then show his details
                    case 5: // if comment is from client then show client details
                      // Do nothing
                      break;
                    default: // any other case considered as Quezx Users
                      tempUser.name = 'QuezX';
                      break;
                  }
                }
                // Customized commenter naming to be viewed by recruiter
                comments[iIndex].user = _.pick(user, ['id', 'name']);
              });
              res.json(comments);
            });
        })
        .catch(err => handleError(res, 500, err));
      break;
    }
  }
}

export function create(req, res) {
  Comment
    .build(req.body)
    .set('applicant_id', req.params.applicantId)
    .set('user_id', req.user.id)
    .save()
    .then(c => {
      res.status(201).json(_.pick(c, ['id', 'status']));

      // @todo Use Solr to get Details
      JobApplication.findOne({
        where: { applicant_id: c.applicant_id },
        attributes: ['id'],
        include: [
          {
            model: Job,
            attributes: ['role', 'user_id'],
          },
          {
            model: db.Applicant,
            attributes: ['name', 'user_id'],
          },
        ],
      })
      .then(j => {
        // j => jobApplication
        User.findAll({
          // get applicant and job related fields
          where: { id: [j.Applicant.user_id, j.Job.user_id] },
          attributes: ['id'],
          include: [
            {
              // Get Consultant and Recruiter Clients
              model: db.Client,
              attributes: ['name'],
              include: [
                {
                  // Get engagement manager emails
                  model: User,
                  as: 'EngagementManager',
                  attributes: ['email_id'],
                },
              ],
            },
          ],
        })
        .then(user => {
          QueuedTask.applicantCommentNotify({
            comment: c.comment,
            applicant: { id: c.applicant_id, name: j.Applicant.name },
            job: { role: j.Job.role, client: user
              .find(u => u.id === j.Job.user_id).Client.name },
            email: _.find(user, u => (u.id === j.Applicant.user_id)).Client.EngagementManager.email_id
          });
        });
      })
      .catch(logger.error);
    })
    .catch(err => handleError(res, 500, err));
}


export function interviewFollowUps(req, res) {
  InterviewFollowUp
    .build({follow_up_option_id : req.body.followUpOptionId})
    .set('applicant_id', req.params.applicantId)
    .set('applicant_state_id', req.params.commentId)
    .set('created_by', req.user.id)
    .save()
    .then(c => {
      return res.status(201).json(_.pick(c, ['id', 'status']));
    })
    .catch(err => handleError(res, 500, err));
}
