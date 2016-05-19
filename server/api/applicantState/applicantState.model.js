
import phpSerialize from './../../components/php-serialize';
import config from './../../config/environment';
import logger from './../../components/logger';

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

