
import _ from 'lodash';
import fsp from 'fs-promise';
import mkdirp from 'mkdirp-then';
import path from 'canonical-path';
import config from './../../config/environment';
import phpSerialize from './../../components/php-serialize';
import logger from './../../components/logger';

export default function (sequelize, DataTypes) {
  const Applicant = sequelize.define('Applicant', {
    id: {
      type: DataTypes.INTEGER(11),
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
      unique: true,
    },
    name: {
      type: DataTypes.STRING(100),
      validate: {
        len: {
          args: [0, 100],
          msg: 'Maximum length for name field is 100',
        },
      },
    },
    total_exp: DataTypes.DECIMAL(15, 2),
    expected_ctc: DataTypes.DECIMAL(15, 2),
    notice_period: {
      type: DataTypes.INTEGER(6),
      validate: {
        isInt: {
          msg: 'notice_period field should be an integer',
        },
        len: {
          args: [0, 6],
          msg: 'Maximum length for notice_period field is 6',
        },
      },
    },
    quezx_id: {
      type: DataTypes.INTEGER(11),
      validate: {
        isInt: {
          msg: 'quezx_id field should be an integer',
        },
        len: {
          args: [0, 11],
          msg: 'Maximum length for quezx_id field is 11',
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
      defaultValue: 1,
    },
    verified: {
      type: DataTypes.INTEGER(4),
      validate: {
        isInt: {
          msg: 'verfied field should be an integer',
        },
        len: {
          args: [0, 4],
          msg: 'Maximum length for verified field is 4',
        },
      },
      defaultValue: 0,
    },
    score: {
      type: DataTypes.INTEGER(4),
      validate: {
        isInt: {
          msg: 'score field should be an integer',
        },
        len: {
          args: [0, 4],
          msg: 'Maximum length for score field is 4',
        },
      },
    },
    created_by: {
      type: DataTypes.INTEGER(14),
      validate: {
        isInt: {
          msg: 'created_by field should be an integer',
        },
        len: {
          args: [0, 14],
          msg: 'Maximum length for created_by field is 14',
        },
      },
    },
    created_at: DataTypes.DATE,
    updated_by: {
      type: DataTypes.INTEGER(14),
      validate: {
        isInt: {
          msg: 'updated_by field should be an integer',
        },
        len: {
          args: [0, 14],
          msg: 'Maximum length for updated_by field is 14',
        },
      },
    },
    updated_on: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    parent_id: {
      type: DataTypes.INTEGER(10),
      validate: {
        isInt: {
          msg: 'parent_id field should be an integer',
        },
        len: {
          args: [0, 10],
          msg: 'Maximum length for parent_id field is 10',
        },
      },
    },
    state_id: {
      type: DataTypes.INTEGER(11),
      validate: {
        isInt: {
          msg: 'state_id field should be an integer',
        },
        len: {
          args: [0, 11],
          msg: 'Maximum length for state_id field is 11',
        },
      },
      defaultValue: 1,
      allowNull: false,
    },
    screening_state_id: {
      type: DataTypes.INTEGER(11),
      validate: {
        isInt: {
          msg: 'screening_state_id field should be an integer',
        },
        len: {
          args: [0, 11],
          msg: 'Maximum length for screening_state_id field is 11',
        },
      },
    },
    applicant_screening_id: {
      type: DataTypes.INTEGER(11),
      validate: {
        isInt: {
          msg: 'applicant_screening_id field should be an integer',
        },
        len: {
          args: [0, 11],
          msg: 'Maximum length for applicant_screening_id field is 11',
        },
      },
      unique: true,
    },
  }, {
    tableName: 'applicants',
    timestamps: false,
    underscored: true,

    classMethods: {
      associate(models) {
        Applicant.belongsTo(models.User, {
          foreignKey: 'user_id',
        });

        Applicant.belongsTo(models.ApplicantState, {
          defaultScope: {
            where: { status: 1 },
          },
          foreignKey: 'applicant_state_id',
        });

        Applicant.belongsToMany(models.Job, {
          through: {
            model: models.JobApplication,
            unique: true,
          },
          foreignKey: 'applicant_id',
          targetKey: 'job_id',
        });

        Applicant.hasMany(models.ApplicantDownload, {
          defaultScope: {
            where: { status: 1 },
          },
        });

        Applicant.hasMany(models.ApplicantSkill, {
          defaultScope: {
            where: { status: 1 },
          },
        });

        Applicant.hasMany(models.ApplicantView, {
          defaultScope: {
            where: { status: 1 },
          },
        });

        Applicant.hasMany(models.Comment, {
          defaultScope: {
            where: { status: 1 },
          },
        });

        Applicant.hasMany(models.Education, {
          defaultScope: {
            where: { status: 1 },
            limit: 1,
            order: 'id DESC',
          },
        });

        Applicant.hasMany(models.Email, {
          defaultScope: {
            where: { status: 1 },
            limit: 1,
            order: 'id DESC',
          },
        });

        Applicant.hasMany(models.Experience, {
          defaultScope: {
            where: { status: 1 },
            limit: 1,
            order: 'id DESC',
          },
        });

        Applicant.hasMany(models.JobApplication, {
          defaultScope: {
            where: { status: 1 },
          },
        });

        Applicant.hasMany(models.PhoneNumber, {
          defaultScope: {
            where: { status: 1 },
            limit: 1,
            order: 'id DESC',
          },
        });

        Applicant.hasMany(models.Resume, {
          defaultScope: {
            where: { status: 1 },
            limit: 1,
            order: 'id DESC',
          },
        });

        Applicant.hasMany(models.Notification, {
          defaultScope: {
            limit: 1,
            order: 'id DESC',
          },
        });

        Applicant.hasMany(models.ApplicantScoreLog, {
          defaultScope: {
            where: { status: 1 },
            limit: 1,
            order: 'id DESC',
          },
        });

        Applicant.hasMany(models.Referral);

        Applicant.hasOne(models.ApplicantPreferenceTime, {
          defaultScope: {
            limit: 1,
          },
        });
      },


      getFullDetails(db, applicantId) {
        return db.Applicant.findById(applicantId, { include: [
          { model: db.PhoneNumber, attributes: ['id', 'number'] },
          { model: db.Email, attributes: ['id', 'email'] },
          { model: db.Resume, attributes: ['path', 'id', 'contents'] },
          { model: db.Education, attributes: ['id', 'degree_id', 'institute_id'] },
          { model: db.Job, attributes: ['id', 'role'] },
          { model: db.JobApplication, attributes: ['id', 'job_id'] },
        ] }).then(applicant => {
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
              const experienceTemp = experience;
              const region = resolvedPromise[0] || {};
              const employer = resolvedPromise[1] || {};
              const designation = resolvedPromise[2] || {};
              experienceTemp.region = region.region;
              experienceTemp.employer = employer.name;
              experienceTemp.designation = designation.name;
              return experienceTemp;
            });
          });
          /* EXP */

          const promises = [
            (applicant.Education.length ?
              db.Degree.findById(applicant.Education[0].degree_id) : []),
            (applicant.Education.length ?
              db.Institute.findById(applicant.Education[0].institute_id) : []),
            experiancePromise,

          ];

          return Promise.all(promises).then(resolvedPromise => {
            const applicantTemp = applicant.toJSON();
            applicantTemp.Degree = resolvedPromise[0];
            applicantTemp.Institute = resolvedPromise[1];
            applicantTemp.Experience = resolvedPromise[2];
            return applicantTemp;
          });
        });
      },


      validateEmailId(models, jobId, email) {
        if (!models) {
          return Promise.reject({ code: 500, desc: 'validateEmailId: models not found' });
        }
        if (!jobId) {
          return Promise.reject({ code: 500, desc: 'validateEmailId: jobId not found' });
        }
        if (!email) {
          return Promise.reject({ code: 500, desc: 'validateEmailId: email not found' });
        }

        return models.JobApplication.findAll({
          attributes: ['id'],
          where: { job_id: jobId },
          include: [{
            model: models.Applicant,
            attributes: ['id'],
            include: [{
              model: models.Email, attributes: ['id'],
              where: { email, status: 1 },
            }],
          }],
        }).then(rows => {
          if (rows.length > 0) return Promise.resolve(true);
          return Promise.resolve(false);
        });
      },
      validatePhoneNumber(models, jobId, number) {
        if (!models) {
          return Promise.reject({ code: 500, desc: 'validatePhoneNumber: models not found' });
        }
        if (!jobId) {
          return Promise.reject({ code: 500, desc: 'validatePhoneNumber: jobId not found' });
        }
        if (!number) {
          return Promise.reject({ code: 500, desc: 'validatePhoneNumber: number not found' });
        }

        return models.JobApplication.findAll({
          attributes: ['id'],
          where: { job_id: jobId },
          include: [{
            model: models.Applicant,
            attributes: ['id'],
            include: [{
              model: models.PhoneNumber,
              attributes: ['id'],
              where: { number, status: 1 },
            }],
          }],
        }).then(rows => {
          if (rows.length > 0) return Promise.resolve(true);
          return Promise.resolve(false);
        });
      },
      alreadyApplied(models, jobId, emailId, number) {
        // TODO Validatio for email id and phone number for same job

        return Promise.all([
          emailId ? models.Applicant.validateEmailId(models, jobId, emailId)
            : Promise.resolve(false),
          number ? models.Applicant.validatePhoneNumber(models, jobId, number)
            : Promise.resolve(false),
        ])
          .then(validationResultArray => {
            const temp = { email: validationResultArray[0], number: validationResultArray[1] };
            return temp;
          });
      },
      validateEmailIdWithApplicantId(models, jobId, email, applicantId) {
        if (!models) return Promise.reject({ desc: 'validateEmailId: models not found' });
        if (!jobId) return Promise.reject({ desc: 'validateEmailId: jobId not found' });
        if (!email) return Promise.reject({ desc: 'validateEmailId: email not found' });

        return models.JobApplication.count({
          attributes: ['id'],
          where: { job_id: jobId, applicant_id: { $ne: applicantId } },
          include: [{
            model: models.Applicant,
            attributes: ['id'],
            include: [{
              model: models.Email,
              attributes: ['id'],
              where: { email, status: 1 } }],
          }],
        }).then(count => {
          if (count) return Promise.resolve(true);
          return Promise.resolve(false);
        });
      },
      validatePhoneNumberWithApplicantId(models, jobId, number, applicantId) {
        if (!models) return Promise.reject({ desc: 'validatePhoneNumber: models not found' });
        if (!jobId) return Promise.reject({ desc: 'validatePhoneNumber: jobId not found' });
        if (!number) return Promise.reject({ desc: 'validatePhoneNumber: number not found' });
        return models.JobApplication.count({
          attributes: ['id'],
          where: { job_id: jobId, applicant_id: { $ne: applicantId } },
          include: [{
            model: models.Applicant,
            attributes: ['id'],
            include: [{
              model: models.PhoneNumber,
              attributes: ['id'],
              where: { number, status: 1 } }],
          }],
        }).then(count => {
          if (count) return Promise.resolve(true);
          return Promise.resolve(false);
        });
      },
      alreadyAppliedWithApplicantId(models, jobId, emailId, number, applicantId) {
        // TODO Validatio for email id and phone number for same job
        return Promise.all([
          emailId ? models.Applicant
            .validateEmailIdWithApplicantId(models, jobId, emailId, applicantId) :
            Promise.resolve(false),
          number ? models.Applicant
            .validatePhoneNumberWithApplicantId(models, jobId, number, applicantId) :
            Promise.resolve(false),
        ])
          .then(validationResultArray => {
            const temp = { email: validationResultArray[0], number: validationResultArray[1] };
            return temp;
          });
      },
      uploadFile(models, source, folder, currentId, ext, id) {
        const SourcePath = `${folder}${currentId}.}${ext}`;
        return fsp.readFile(source).then(fileStream => mkdirp(folder)
          .then(() => fsp.writeFile(SourcePath, fileStream).then(() => {
            const data = phpSerialize.serialize({
              command: `${config.QUARC_PATH}app/Console/cake`,
              params: [
                'beautify_file',
                '-t', 'a',
                '-i', id,
              ],
            });
            models.QueuedTask
              .create({ jobType: 'Execute', group: 'conversion', data })
              .catch(logger.error);
            return 0;
          })));
      },
      saveApplicant(models, argApplicantToSave, file, userId, jobId, argStateId) {
        if (!models) return Promise.reject({ desc: 'saveApplicant: models not found' });
        if (!argApplicantToSave) return Promise.reject({ desc: 'applicant not found' });
        if (!userId) return Promise.reject({ desc: 'saveApplicant: userId not found' });
        if (!jobId) return Promise.reject({ desc: 'saveApplicant:  jobId not found' });
        if (!file) return Promise.reject({ desc: 'saveApplicant: file not found' });
        const stateId = argStateId || 27; // Screening Pending
        const applicantToSave = argApplicantToSave;
        applicantToSave.institute_id = applicantToSave.institute_id || 1;

        return models.Applicant
          .alreadyApplied(models, jobId, applicantToSave.email_id, applicantToSave.number)
          .then(status => {
            if (status.email === true || status.number === true) {
              return Promise.reject(_.extend({
                code: 409,
                message: 'phone or email conflict',
              }, status));
            }

            return models.Applicant.build(_.pick(applicantToSave,
                ['name', 'expected_ctc', 'salary', 'notice_period', 'total_exp']), {
                  include: [
                    models.PhoneNumber, models.Email, models.Education,
                    models.JobApplication, models.ApplicantState, models.Experience, models.Resume,
                  ],
                })
              .set('user_id', userId)
              // .set('created_at',)
              .set('created_by', userId)
              .set('updated_by', userId)
              .set('Emails', { email: applicantToSave.email_id })
              .set('Education', {
                degree_id: applicantToSave.degree_id,
                institute_id: applicantToSave.institute_id,
              })
              .set('PhoneNumbers', { number: applicantToSave.number })
              .set('JobApplications', { job_id: jobId })
              .set('Experiences', {
                region_id: applicantToSave.region_id,
                employer_id: applicantToSave.employer_id,
                designation_id: applicantToSave.designation_id,
                salary: applicantToSave.salary,
              })
              .save()
              .then(applicant => {
                const applicantStateToSave = {
                  state_id: stateId,
                  user_id: userId,
                  applicant_id: applicant.id,
                };
                return models.ApplicantState
                  .create(applicantStateToSave)
                  .then(applicantState => {
                    models.ApplicantScreening.legacyMap(models, [applicantStateToSave], userId)
                      .catch(logger.error);
                    models.Job.findById(jobId).then(job => {
                      if (job.direct_line_up === 1) {
                        const awf = {
                          state_id: 1,
                          user_id: 1,
                          applicant_id: applicant.id,
                          comments: 'Automated',
                        };

                        const pr = models.ApplicantState.updateState(models, awf, userId);
                        models.ApplicantScreening.legacyMap(models, [awf], userId);

                        const cvs = {
                          state_id: 19,
                          user_id: 1,
                          applicant_id: applicant.id,
                          comments: 'Direct-Line-Up auto-shortlist',
                        };
                        pr.then(() => models.ApplicantState.updateState(models, cvs, userId));
                      }
                      models
                        .Applicant.processApplicantCharactersticks(models, applicant.id, job.id)
                        .catch(logger.error);
                      return 'Async Return';
                    }).catch(logger.error);

                    const rangeFolder = (applicant.id - (applicant.id % 10000)).toString();
                    const absFolderPathToSave = `${path.join(config.QDMS_PATH, 'Applicants',
                        rangeFolder, applicant.id.toString())}/`;

                    const fileName = file.name;

                    // Todo: Copy is better than read and write
                    const resumePromise = fsp.readFile(file.path).then(fileStream => {
                      const fileExt = fileName.split('.').pop().toLowerCase(); // Extension
                      const allowedExtType = ['doc', 'docx', 'pdf', 'rtf', 'txt'];
                      return mkdirp(absFolderPathToSave).then(() => {
                        if (allowedExtType.indexOf(fileExt) === -1) {
                          return Promise.reject({ code: 500, desc: 'File Type Not Allowed' });
                        }
                        const absFilePath = `${absFolderPathToSave}${applicant.id}.${fileExt}`;
                        return fsp.writeFile(absFilePath, fileStream)
                          .then(() => models.Resume.create({
                            applicant_id: applicant.id,
                            contents: 'Please wait the file is under processing',
                            path: path.join('Applicants/', rangeFolder, applicant.id.toString(),
                              [applicant.id, fileExt].join('.')),
                          }).then(resume => {
                            const data = phpSerialize.serialize({
                              command: `${config.QUARC_PATH}app/Console/cake`,
                              params: [
                                'beautify_file',
                                '-t', 'a',
                                '-i', applicant.id,
                              ],
                            });

                            models.QueuedTask.create({
                              jobType: 'Execute',
                              group: 'conversion',
                              data,
                            }).catch(logger.error);

                            return resume;
                          }));
                      });
                    });

                    return Promise.all([
                      applicant.update({ applicant_state_id: applicantState.id }),
                      resumePromise,
                    ]).then((promiseReturns) => {
                      const updatedApplicant = promiseReturns[0];
                      // Async: Not returned
                      models.Applicant.sendWelcomeEmail(models, updatedApplicant.id)
                        .catch(logger.error);

                      applicant.updateSolr(models, userId, jobId)
                        .catch(logger.error);

                      return applicant;
                    });
                  });
              });
          });
      },
      getPreferredPath(fpath) {
        const folder = `${path.dirname(fpath)}/`;
        const file = `${folder}concat.pdf`;
        if (fsp.existsSync(config.QDMS_PATH + file)) {
          return file;
        }
        return fpath;
      },
      sendWelcomeEmail(models, id) {
        const datetime = {
          applicant_id: id,
          hash: this.generatehash(50),
        };
        return models.ApplicantPreferenceTime
          .build(datetime)
          .save()
          .then(() => {
            const attrib = ['id', 'name', 'expected_ctc', 'total_exp', 'user_id', 'notice_period'];
            return models.Applicant.findOne({
              attributes: attrib,
              where: { id },
              include: [
                {
                  model: models.Experience,
                  attributes: ['employer_id', 'designation_id', 'region_id', 'salary'],
                  include: [
                    // {model: models.Employer, attributes: ['name']}, // Quantum
                    // {model: models.Designation, attributes: ['name']}, // Quantum
                    // {model: models.Region, attributes: ['region']} // Qunatum
                  ],
                },
                { model: models.Email, attributes: ['email'] },
                { model: models.PhoneNumber, attributes: ['number'] },
                {
                  model: models.Education, attributes: ['degree_id'],
                  // , include: [{model: models.Degree, attributes: ['degree']}] // Quantum
                },
                {
                  model: models.JobApplication, attributes: ['id'],
                  required: false,
                  include: [{
                    model: models.Job, attributes: ['role', 'job_content_id', 'user_id', 'id'],
                    include: [
                      { model: models.JobContent, attributes: ['path'] },
                    ],
                  }],
                },
                { model: models.Resume, attributes: ['path'] },
                { model: models.ApplicantPreferenceTime },
              ],
            }).then(applicant => {
              const att = ['degree'];
              return Promise.all([
                (applicant.Education[0] ? models.Degree.find({
                  attributes: att,
                  where: { id: _.get(applicant.Education[0], 'degree_id') },
                }) : []),
                (applicant.Experiences[0] ? models.Employer.find({
                  attributes: ['name'],
                  where: { id: _.get(applicant.Experiences[0], 'employer_id') },
                }) : []),
                (applicant.Experiences[0] ? models.Designation.find({
                  attributes: ['name'],
                  where: { id: _.get(applicant.Experiences[0], 'designation_id') },
                }) : []),
                (applicant.Experiences[0] ? models.Region.find({
                  where: { id: _.get(applicant.Experiences[0], 'region_id') },
                  include: [models.Province],
                  attributes: ['region'],
                }) : []),
                // Applicant Owner - Consultant
                models.User.find({
                  attributes: ['id', 'name', 'username'], where: { id: applicant.user_id },
                  include: [{ attributes: ['id', 'name', 'eng_mgr_id'], model: models.Client }],
                }),
                // Job Owner - Company
                models.User.find({
                  attributes: ['name', 'username'],
                  where: { id: applicant.JobApplications[0].Job.user_id },
                }),
              ]).then(prRet => {
                const plainApplicant = applicant.toJSON();
                if (plainApplicant.Education[0]) {
                  plainApplicant.Education[0].Degree = typeof prRet[0] === 'object' ?
                    prRet[0].toJSON() : {};
                }
                if (plainApplicant.Experiences[0]) {
                  plainApplicant.Experiences[0].Employer = typeof prRet[1] === 'object' ?
                    prRet[1].toJSON() : {};
                  plainApplicant.Experiences[0].Designation = typeof prRet[2] === 'object' ?
                    prRet[2].toJSON() : {};
                  plainApplicant.Experiences[0].Region = typeof prRet[3] === 'object' ?
                    prRet[3].toJSON() : {};
                }

                plainApplicant.User = typeof prRet[4] === 'object' ? prRet[4].toJSON() : {};
                if (plainApplicant.JobApplications[0]) {
                  plainApplicant.JobApplications[0].Job.User = typeof prRet[5] === 'object' ?
                    prRet[5].toJSON() : {};
                }

                const jobContentFilePath = plainApplicant.JobApplications[0].Job.JobContent.path ?
                  `${config.QDMS_PATH}${plainApplicant.JobApplications[0].Job.JobContent.path}` :
                  null;

                const jobContentFileExt = jobContentFilePath ? jobContentFilePath.split('.') : null;

                const resumeFilePath = _.get(applicant.Resumes[0], 'path') ?
                  `${config.QDMS_PATH}${applicant.Resumes[0].path}` : '';

                const resumeExt = resumeFilePath ? resumeFilePath.split('.') : null;

                const file1 = jobContentFileExt.length ?
                  `Job_Description.${jobContentFileExt[1]}` : '';
                const file2 = resumeExt.length ? `Your_Resume.${resumeExt[1]}` : '';

                const attachments = [{}];
                if (file1) {
                  attachments[0][file1] = jobContentFilePath;
                }
                if (file2) {
                  attachments[0][file2] = resumeFilePath;
                }

                // Mail to Applicant
                const subject = `QuezX.com - Application for
                ${plainApplicant.JobApplications[0].Job.User.name} -
                ${plainApplicant.JobApplications[0].Job.role}`;

                const emailData = {
                  settings: {
                    subject,
                    to: _.get(plainApplicant.Emails[0], 'email'),
                    bcc: 'quezx@quetzal.in',
                    replyTo: 'candidate-upload@quezx.com',
                    from: ['notifications@quezx.com', 'QuezX.com'],
                    domain: 'Quezx.com',
                    attachments,
                    template: ['email_candidate'],
                  },
                  consts: {
                    details: {
                      Applicant: _.pick(plainApplicant, [
                        'name', 'expected_ctc', 'total_exp',
                        'user_id', 'notice_period', 'id',
                      ]),
                      User: _.pick(plainApplicant.User, ['name', 'username']),
                      ApplicantPreferenceTime: plainApplicant.ApplicantPreferenceTime,
                      Education: plainApplicant.Education,
                      Email: plainApplicant.Emails,
                      Experience: plainApplicant.Experiences,
                      JobApplication: plainApplicant.JobApplications,
                      PhoneNumber: plainApplicant.PhoneNumbers,
                      Resume: plainApplicant.Resumes,
                    },
                    appid: id,
                  },
                };

                const data = phpSerialize.serialize(emailData);

                const task = {
                  jobType: 'Email',
                  group: 'high',
                  data,
                };

                const sendMailToCandidatePromise = models.QueuedTask.create(task);

                const sendMailToConsultantEMPromise = models.User
                  .find({ where: { id: plainApplicant.User.Client.eng_mgr_id } })
                  .then(consultantEm => {
                    const msg = `
                    ${plainApplicant.User.username}  has uploaded a CV <br>
                    Name: ${plainApplicant.name}<br>
                    Client: ${plainApplicant.JobApplications[0].Job.User.name}<br>
                    Position: ${plainApplicant.JobApplications[0].Job.role}<br>
                    You can manage the applicants here
                    <a href="https://app.quezx.com/Applicants/view/applicants/${id}">
                    View Aplicant</a>`;

                    const emailInternals = {
                      settings: {
                        subject: 'New Candidate Upload',
                        to: consultantEm.email_id,
                        bcc: 'quezx@quetzal.in',
                        emailFormat: 'html',
                        from: ['notifications@quezx.com', 'Candidate Upload'],
                        domain: 'Quezx.com',
                      },
                      vars: {
                        content: msg,
                      },
                    };

                    const internalData = phpSerialize.serialize(emailInternals);
                    const internalTask = {
                      jobType: 'Email',
                      group: 'email',
                      data: internalData,
                    };
                    return models.QueuedTask.create(internalTask);
                  });

                return Promise.all([
                  sendMailToCandidatePromise,
                  sendMailToConsultantEMPromise,
                ]);
              });
            });
          });
      },
      // Todo: generate hash to be replaced by some library for more robust and simple code
      generatehash(argLength) {
        const length = argLength || 150;
        const characters = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const charactersLength = characters.length;
        let randomString = '';
        for (let i = 0; i < length; i++) {
          randomString += characters[Math.floor((Math.random() * (charactersLength - 1)))];
        }
        return randomString;
      },
      processApplicantCharactersticks(models, id, jobId) {
        const extractApplicant = phpSerialize.serialize({
          command: `${config.QUARC_PATH}app/Console/cake`,
          params: [
            'extract_applicant',
            '-a', id,
          ],
        });

        const updateScore = phpSerialize.serialize({
          command: `${config.QUARC_PATH}app/Console/cake`,
          params: [
            'update_score',
            '-j', jobId,
          ],
        });

        const updateStates = phpSerialize.serialize({
          command: `${config.QUARC_PATH}app/Console/cake`,
          params: [
            'update_status',
            '-i', id,
          ],
        });

        return Promise.all([
          models.QueuedTask.create({ jobType: 'Execute', group: 'low', data: extractApplicant }),
          models.QueuedTask.create({ jobType: 'Execute', group: 'low', data: updateScore }),
          models.QueuedTask.create({ jobType: 'Execute', group: 'low', data: updateStates })]);
      },
    },
    instanceMethods: {
      updateSolr(db, userId, jobId) {
        const _this = this;

        if (!db) return Promise.reject('updateSolr: db not defined');
        if (!userId) return Promise.reject('updateSolr: userId not defined');
        if (!jobId) return Promise.reject('updateSolr: jobId not defined');

        // Todo: _this is current applicant, No need to query again
        return db.Applicant.find({
          attributes: ['id', 'name', 'total_exp', 'expected_ctc', 'notice_period',
            ['score', 'applicant_score'], 'verified', ['created_at', 'created_on'],
            'updated_on', ['user_id', 'owner_id']],
          where: { id: _this.id },
          include: [
            { model: db.PhoneNumber, attributes: ['number'] },
            { model: db.Email, attributes: ['email'] },
            { model: db.Comment, attributes: ['comment'],
              order: 'updated_on DESC', required: false },
            { model: db.Resume, attributes: ['contents'] },
            { model: db.Education, attributes: ['degree_id', 'institute_id'] },
            { model: db.JobApplication, attributes: [],
              include: [{ model: db.Job, attributes: [] }] },
            { model: db.ApplicantState, attributes: ['state_id'],
              include: [{ model: db.State, attributes: ['id', 'name'] }] },
            { model: db.ApplicantSkill, attributes: ['skill_id'] },
          ],
        }).then(applicant => {
          if (!applicant) return Promise.reject('Candidate not found while updating to solr');

          const experiancePromise = db.Experience.find({
            where: { applicant_id: _this.id },
            raw: true,
          }).then(experience => Promise.all([
            db.Region.findById(experience.region_id),
            db.Employer.findById(experience.employer_id),
            db.Designation.findById(experience.designation_id),
          ]).then(resolvedPromise => {
            const region = resolvedPromise[0] || {};
            const employer = resolvedPromise[1] || {};
            const designation = resolvedPromise[2] || {};
            const temp = experience;
            temp.region = region.region;
            temp.employer = employer.name;
            temp.designation = designation.name;
            return temp;
          }));

          const latestCommentQuery = `
            (SELECT comment AS latest_comment, updated_on AS LC_updated_on FROM comments
            WHERE (applicant_id = ${applicant.id}) AND (status = 1) ORDER BY id DESC LIMIT 1)
            UNION
            (SELECT comments AS latest_comment, updated_on AS LC_updated_on FROM applicant_states
            WHERE applicant_id = ${applicant.id} ORDER BY id DESC LIMIT 1)
            ORDER BY LC_updated_on DESC LIMIT 1`;

          // For Feteching skills
          const skillIds = applicant.ApplicantSkills.map(skill => skill.skill_id);

          const promises = [
            (applicant.Education.length ?
              db.Degree.findById(applicant.Education[0].degree_id) : []),
            (applicant.Education.length ?
              db.Institute.findById(applicant.Education[0].institute_id) : []),
            // Current Consultant and Client Details
            db.User.find({ where: { id: userId }, include: [db.Client], raw: true }),
            db.sequelizeQuarc.query(latestCommentQuery, { type: db.Sequelize.QueryTypes.SELECT }),
            db.Skill.findAll({ where: { id: { $in: skillIds }, system_defined: 1 }, raw: true }),
            experiancePromise,
          ];

          return Promise.all(promises).then(resolvedPromise => {
            const degree = resolvedPromise[0];
            const institute = resolvedPromise[1];
            const client = resolvedPromise[2];
            const latestComment = resolvedPromise[3].comment;
            const simpleSkills = resolvedPromise[4].map(skill => skill.name);
            const experience = resolvedPromise[5];
            const engagementManagerId = client['Client.eng_mgr_id'];

            return db.User
              .find({ where: { id: engagementManagerId }, attributes: ['name'], raw: true })
              .then(engMgr => {
                const solrRecord = {
                  updated_on: applicant.updated_on,
                  type_s: 'applicant',
                  // Todo: .user_id is found in previousDatavalues of applicant,
                  owner_id: applicant.user_id || _this.user_id,
                  mobile: _.get(applicant.PhoneNumbers[0], 'number'),
                  verified: applicant.verified,
                  applicant_score: applicant.applicant_score,
                  expected_ctc: applicant.expected_ctc,
                  state_name: applicant.ApplicantState.State.get('name'),
                  created_on: applicant.created_on,
                  name: applicant.name,
                  id: applicant.id,
                  state_id: applicant.ApplicantState.State.get('id'),
                  notice_period: applicant.notice_period,
                  total_exp: applicant.total_exp,
                  email: applicant.Emails.length ? applicant.Emails[0].email : '',
                  latest_comment: latestComment,

                  consultant_username: client.name,
                  eng_mgr_name: engMgr.name,
                  client_name: client['Client.name'],

                  skills: simpleSkills,
                  edu_institute: institute.name,
                  edu_degree: degree.degree,
                  exp_salary: experience.salary,
                  exp_designation: experience.designation,
                  exp_location: experience.region,
                  exp_employer: experience.employer,
                  _root_: jobId,
                };

                return db.Solr.add(solrRecord, (err) => {
                  if (err) return Promise.reject(err);
                  return db.Solr.softCommit();
                });
              });
          });
        });
      },
    },
  });

  return Applicant;
}
