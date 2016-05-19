
import _ from 'lodash';
import phpSerialize from './../../components/php-serialize';
import config from './../../config/environment';
import logger from './../../components/logger';
import solrSchema from './../../config/solrSchema';

export default function (sequelize, DataTypes) {
  const ApplicantState = sequelize.define('ApplicantState', {
    id: {
      type: DataTypes.INTEGER(14),
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
      unique: true,
    },
    applicant_id: {
      type: DataTypes.INTEGER(14),
      validate: {
        isInt: {
          msg: 'applicant_id field should be an integer',
        },
        len: {
          args: [0, 14],
          msg: 'Maximum length for applicant_id field is 14',
        },
      },
      allowNull: false,
    },
    state_id: {
      type: DataTypes.INTEGER(14),
      allowNull: false,
    },
    user_id: {
      type: DataTypes.INTEGER(14),
      allowNull: false,
    },
    scheduled_on: DataTypes.DATE,
    suggested_join_date: DataTypes.DATE,
    offered_ctc: {
      type: DataTypes.DECIMAL(15, 2),
      validate: {
        isDecimal: {
          msg: 'offered_ctc field should be a decimal',
        },
        len: {
          args: [0, 13],
          msg: 'Maximum length for user_id field is 13',
        },
      },
    },
    offered_ctc_raw: {
      type: DataTypes.DECIMAL(40, 2),
      validate: {
        isDecimal: {
          msg: 'offered_ctc_raw field should be a decimal',
        },
        len: {
          args: [0, 38],
          msg: 'Maximum length for user_id field is 38',
        },
      },
    },
    final_ctc: {
      type: DataTypes.DECIMAL(15, 2),
      validate: {
        isDecimal: {
          msg: 'final_ctc field should be a decimal',
        },
        len: {
          args: [0, 13],
          msg: 'Maximum length for user_id field is 13',
        },
      },
    },
    final_ctc_raw: {
      type: DataTypes.DECIMAL(40, 2),
      validate: {
        isDecimal: {
          msg: 'final_ctc_raw field should be a decimal',
        },
        len: {
          args: [0, 38],
          msg: 'Maximum length for user_id field is 38',
        },
      },
    },
    comments: {
      type: DataTypes.STRING(100),
      validate: {
        len: {
          args: [0, 100],
          msg: 'Maximum length for comments field is 100',
        },
      },
    },
    currency: {
      type: DataTypes.STRING(3),
      validate: {
        len: {
          args: [0, 3],
          msg: 'Maximum length for currency field is 3',
        },
      },
    },
    job_score_id: {
      type: DataTypes.INTEGER(11),
      validate: {
        len: {
          args: [0, 3],
          msg: 'Maximum length for job_score_id is 11',
        },
      },
    },
    status: {
      type: DataTypes.INTEGER(1),
      validate: {
        isInt: {
          msg: 'status field should be an integer',
        },
        len: {
          args: [0, 1],
          msg: 'Maximum length for status field is 1',
        },
      },
    },
    updated_on: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    created_on: {
      type: DataTypes.VIRTUAL(DataTypes.DATE, ['updated_on']),
      get: function getCreateOn() {
        return this.updated_on;
      },
    },
    comment: {
      type: DataTypes.VIRTUAL(DataTypes.STRING(100), ['comments']),
      get: function getComment() {
        return this.comments;
      },
    },
  }, {
    tableName: 'applicant_states',
    timestamps: false,
    underscored: true,
    defaultScope: {
      where: { status: 1 },
    },

    classMethods: {
      associate(models) {
        ApplicantState.belongsTo(models.Applicant, {
          foreignKey: 'applicant_id',
        });

        ApplicantState.belongsTo(models.State, {
          foreignKey: 'state_id',
        });

        ApplicantState.belongsTo(models.User, {
          foreignKey: 'user_id',
        });

        ApplicantState.belongsTo(models.JobScore);
        ApplicantState.hasMany(models.InterviewFollowUp);
      },
      updateState(models, argApplicantState, LoggedInUserId) {
        const applicantState = argApplicantState;
        applicantState.user_id = !applicantState.user_id ?
          LoggedInUserId : applicantState.user_id;
        return models.ApplicantState.create(applicantState).then(aplState => {
          const appl = {
            applicant_state_id: aplState.id,
            state_id: applicantState.state_id,
          };

          return models.Applicant.findById(applicantState.applicant_id)
            .then(applicant => applicant.update(appl));
        });
      },

      /**
       * Realtime Solr Index update on state change of applicant
       * @param  {Object} solr                      Solr server instance
       * @param  {Object} update                    Required data to be updated
       * @param  {Number} update.job.id             Job ID
       * @param  {Number} update.applicant.id       Applicant ID
       * @param  {Object} update.state              State Update Object
       * @param  {Object} update.state.state_id     State ID
       * @param  {Object} update.state.state_name   State name
       * @param  {Object} update.state.comment      State comment
       * @param  {Object} update.state.scheduled_on Interview time
       * @return {Error}        Error if failed
       */
      updateSolr: function updateSolr(solr, update) {
        // Please Test fully before editing this function
        const bq = {};
        bq[`id:${update.applicant.id}`] = 2000;
        const solrQuery = solr.createQuery()
          .q(`_root_:${update.job.id}`)
          .defType('edismax')
          .bq(bq)

          // It must be synched with solr schema configuration
          // Avoid geting copy fields and include all other fields
          .fl(solrSchema)
          .sort({
            type_s: 'DESC',
            score: 'DESC',
          })
          .rows(800);
        solr.get('select', solrQuery, (err, res) => {
          if (err) return logger.error('State change solr getDoc Error', err);

          const childs = res.response.docs;
          const parent = childs.splice(0, 1)[0];
          if (!parent) return logger.error('changeState: Failed to get Job', err);

          childs[0].state_id = update.state.state_id;
          childs[0].state_name = update.state.state_name;
          childs[0].latest_comment = update.state.comment;
          childs[0].updated_on = update.state.updated_on;

          // overwrite interview fields
          if (~[5, 8, 17].indexOf(update.state.state_id)) {
            childs[0].interview_time = update.state.scheduled_on;
            childs[0].interview_type = update.state.state_id;
          }

          return solr.add(_.assign(parent, { _childDocuments_: childs }), e => {
            if (e) return logger.error('State change solr updateDocs Error', e);
            return solr.softCommit();
          });
        });
      },
    },
    hooks: {
      afterCreate(instance) {
/*  eslint global-require:0 */
        const models = require('./../../sqldb');

        return models.JobApplication.find({
          attributes: ['id', 'job_id'],
          where: {
            applicant_id: instance.applicant_id,
          },
        }).then(aplState => {
          const jobScoreUpdateOptions = phpSerialize.serialize({
            command: `${config.QUARC_PATH}app/Console/cake`,
            params: [
              'update_job_score',
              '-j', aplState.job_id,
              '-a', aplState.id,
            ],
          });
          return models.QueuedTask.create({
            jobType: 'Execute',
            group: 'jobScoreUpdate',
            data: jobScoreUpdateOptions,
          });
        }).catch(logger.error);
      },
    },
  });

  ApplicantState.beforeValidate((as) => {
    const ocr = as.offered_ctc_raw;
    const fcr = as.final_ctc_raw;
    const fc = as.final_ctc;
    const oc = as.offered_ctc;
    const result = as;
    result.final_ctc = !isNaN(fc) ? Number(Number(fc).toFixed(2)) : null;
    result.final_ctc_raw = !isNaN(fcr) ? Number(Number(fcr).toFixed(2)) : null;
    result.offered_ctc_raw = !isNaN(ocr) ? Number(Number(ocr).toFixed(2)) : null;
    result.offered_ctc = !isNaN(oc) ? Number(Number(oc).toFixed(2)) : null;
    return sequelize.Promise.resolve(result);
  });

  return ApplicantState;
}

