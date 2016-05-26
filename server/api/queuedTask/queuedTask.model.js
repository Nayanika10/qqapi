

const _ = require('lodash');
const config = require('./../../config/environment');
const php = require('./../../components/php-serialize');

module.exports = function QueuedTaskModel(sequelize, DataTypes) {
  const QueuedTask = sequelize.define('QueuedTask', {
    id: {
      type: DataTypes.INTEGER(11),
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
      unique: true,
    },
    jobType: {
      type: DataTypes.STRING(45),
      validate: {
        len: {
          args: [0, 45],
          msg: 'Maximum length for name field is 45',
        },
      },
      allowNull: false,
    },
    data: {
      type: DataTypes.TEXT('medium'),
    },
    group: {
      type: DataTypes.STRING(255),
    },
    reference: {
      type: DataTypes.STRING(255),
    },
    created: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    notbefore: {
      type: DataTypes.DATE,
    },
    fetched: {
      type: DataTypes.DATE,
    },
    progress: {
      type: DataTypes.FLOAT(3, 2),
    },
    completed: {
      type: DataTypes.DATE,
    },
    failed: {
      type: DataTypes.INTEGER(3),
    },
    failure_message: {
      type: DataTypes.TEXT(),
    },
    workerkey: {
      type: DataTypes.STRING(45),
    },
  }, {
    tableName: 'queued_tasks',
    timestamps: false,
    underscored: true,
    classMethods: {
      /**
       * After State Change background task done via cron
       * @param  {Object} model Command line arguments
       * @param  {Number} model.state_id      State Id
       * @param  {Number} model.applicant_id  Applicant Id
       * @param  {Number} model.user_id       Action by User id
       * @return {Promise.<Number>}  Sequelize Create Row Promise
       */
      postChangeStateActions(model) {
        const data = php.serialize({
          command: `${config.QUARC_PATH}/app/Console/cake`,
          params: [
            'state_change_action',
            '-s', model.state_id,
            '-a', model.applicant_id,
            '-u', model.user_id,
          ],
        });

        return this.create({
          jobType: 'Execute',
          group: 'high',
          data,
        });
      },

      addJobFollowerNotify(options) {
        const data = php.serialize({
          settings: {
            subject: `[QuezX Hire] You are following ${options.client.name} - ${options.job.role}`,
            to: options.user.email_id,
            cc: options.client.EngagementManager.email_id,
            bcc: 'client.relations@quetzal.in',
            from: ['clientactivity@quezx.com', 'QuezX.com'],
            domain: 'Quezx.com',
          },
          vars: {
            content: `
              Hi ${options.user.name},
              <br /><br />
              You have been added as a follower for job profile
              <a href='//hire.${config.DOMAIN}/app/jobs/${options.job.id}'>
                ${options.client.name} - ${options.job.role}
              </a><br /><br />
              You have ${options.access} access.
            `,
          },
        });

        return this.create({
          jobType: 'Email',
          group: 'email',
          data,
        });
      },

      clientLoginNotify(options) {
        const data = php.serialize({
          settings: {
            subject: `[QuezX Hire] Client - ${options.user.name} [${options.client.name}]` +
            ' Logged in | Internal Notification',
            to: options.client.EngagementManager.email_id,
            bcc: 'client.relations@quetzal.in',
            from: ['clientactivity@quezx.com', 'QuezX.com'],
            domain: 'Quezx.com',
            emailFormat: 'html',
            template: ['internalNotification'],
          },
          vars: {
            finalData: {
              id: options.user.id,
              name: `${options.user.name} [${options.client.name}]`,
              number: options.user.number,
              email_id: options.user.email_id,
            },
          },
        });

        return this.create({
          jobType: 'Email',
          group: 'low',
          data,
        });
      },

      /**
       * Notify EMs by email for Applicant State Change
       * @param  {Object}   options                   Email config and data
       * @param  {String}   options.email             EM email
       * @param  {Object}   options.applicant         Applicant details
       * @param  {Number}   options.applicant.id      Applicant id
       * @param  {String}   options.applicant.name    Applicant name
       * @param  {Object}   options.applicant.creator Applicant creator User
       * @param  {Object}   options.state             State Object
       * @param  {String}   options.state.name        State name
       * @param  {String}   options.state.comment     State change comment
       * @param  {Object}   options.job               Job Profile
       * @param  {String}   options.job.role          Job position name
       * @param  {Object}   options.job.creator       Job creator User
       * @return {Promise.<number>} Return promise for inseration of row in QueuedTask
       */
      changeStateNotify(options) {
        const data = php.serialize({
          settings: {
            subject: `[QuezX Hire] ${options.job.creator.Client.name} | ${options.job.role},`,
            to: options.email,
            bcc: 'client.relations@quetzal.in',
            from: ['clientactivity@quezx.com', 'QuezX.com'],
            domain: 'Quezx.com',
            emailFormat: 'html',
            template: ['internalNotificationStatusChange'],
          },
          vars: {
            notification: { applicant_id: options.applicant.id },
            server: options.server,
            notificationData: {
              candidate_name: options.applicant.name,
              status: options.state.name,
              comment: options.state.comment,

              // serialize: too long object causes RangeError: Maximum call stack size exceeded
              consultant_name: options.applicant.creator.name,
            },
          },
        });

        return this.create({
          jobType: 'Email',
          group: 'low',
          data,
        });
      },

      createJDNotify(options) {
        const data = php.serialize({
          settings: {
            subject: `[QuezX Hire] New JD: ${options.job.role} | uploaded by ${options.user.name}`,
            to: 'client@quezx.com',
            cc: 'consultant@quezx.com',
            from: ['jd-upload@quezx.com', 'QuezX.com'],
            domain: 'Quezx.com',
            emailFormat: 'html',
          },
          vars: {
            content: `Please view the JD here
              <a href="//app.quezx.com/jobs/view/${options.job.id}" target="_blank">
                ${options.job.role}
              </a>`,
          },
        });

        return this.create({
          jobType: 'Email',
          group: 'low',
          data,
        });
      },

      /**
       * Job update emails to consultants
       * `WARN:` still skips many feature over last implementation
       *   - responsibility and comments of job ommited due to email fail
       *   - Email Attachment of updated Job skipped till better understanding
       * @param  {Object} current Solr indexed current job data
       * @param  {Object} update  Solr indexed update data
       * @param  {Array} emails   Array of email of consultants
       * @return {Array.Promise.<Number>}         Array of email queue write promise
       */
      updateJDNotify(current, update, emails, pdf) {
        // Still some intentetional fields skipping due to non-indexed fields
        function ultraJoin(array) {
          return Array.isArray(array) ? array.join(', ') : '';
        }

        function formatJob(x) {
          const job = _.pick(x, [
            'role', 'vacancy', 'min_exp', 'max_exp', 'min_sal', 'max_sal', 'perks', 'days_per_week',
            'start_work_time', 'end_work_time', 'preferred_genders', 'responsibility', 'comments',
            'job_nature', 'interview_addr', 'interview_place_direction', 'direct_line_up',
          ]);

          job.comments = ''; // currently not indexed in Solr
          job.responsibility = ''; // too long causes failure to deserialize/Email
          return [
            {
              Job: job,
              JobStatus: { name: x.job_status },
              Region: { region: x.job_location },
              Func: { name: '' }, // not indexed currently
            },
          ];
        }

        const data = {
          settings: {
            subject: `[QuezX Hire] New Update in JD - ${current.client_name} - ${current.role}`,
            bcc: 'quezx@quetzal.in',
            from: ['notifications@quezx.com', 'QuezX.com'],
            domain: 'Quezx.com',
            emailFormat: 'html',
            template: ['jdedit'],
            addAttachment: [[pdf], `${current.client_name} - ${current.role}.pdf`],
          },
          vars: {
            newdata: formatJob(update), olddata: formatJob(current),
            newRequiredSkills: ultraJoin(update.required_skills),
            oldRequiredSkills: ultraJoin(current.required_skills),
            newOptionalSkills: ultraJoin(update.optional_skills),
            oldOptionalSkills: ultraJoin(current.optional_skills),
            newDegree: ultraJoin(update.degrees),
            oldDegree: ultraJoin(current.degrees),
            newEmp: ultraJoin(update.employers),
            oldEmp: ultraJoin(current.employers),
            newInstitute: ultraJoin(update.institutes),
            oldInstitute: ultraJoin(current.institutes),
            newIndustry: ultraJoin(update.industries),
            oldIndustry: ultraJoin(current.industries),
          },
        };

        return this.bulkCreate(

          // internal emails
          [[['consultant@quetzal.in', 'screening@quetzal.in']]]
            .concat(emails)
            .map(x => {
              data.settings.to = x;
              return {
                jobType: 'Email',
                group: 'low',
                data: php.serialize(data),
              };
            }),
          { validate: true }
        );
      },

      jobCommentNotify(options) {
        const data = php.serialize({
          settings: {
            subject: `[QuezX Hire] A new comment on JD - ${options.client} - ${options.role}`,
            to: options.email_id,
            bcc: 'quezx@quetzal.in',
            from: ['notifications@quezx.com', 'QuezX.com'],
            replyTo: 'consultant@quezx.com',
            domain: 'Quezx.com',
            emailFormat: 'html',
            template: ['jdcomment'],
          },
          vars: {
            userid: { Job: { role: options.role } },
            client: options.client,
            data: options.comment,
          },
        });

        return this.create({
          jobType: 'Email',
          group: 'high',
          data,
        });
      },

      /**
       * Adds email for Applicant comment to queue
       * @param  {Object}   options                 Email config and data
       * @param  {String}   options.comment         Comment text
       * @param  {String}   options.email           Email to send email to
       * @param  {Object}   options.applicant       Applicant details
       * @param  {Number}   options.applicant.id    Applicant id
       * @param  {String}   options.applicant.name  Applicant name
       * @param  {Object}   options.job             Job Profile
       * @param  {String}   options.job.client      Job Recruiter company name
       * @param  {String}   options.job.role        Job position name
       * @return {Promise.<number>} Return promise for inseration of row in QueuedTask
       */
      applicantCommentNotify(options) {
        const data = php.serialize({
          settings: {
            subject: `[QuezX Partner] Comment by - ${options.job.client} - ` +
            `${options.job.role} - ${options.applicant.name}`,
            to: options.email,
            bcc: 'client.relations@quetzal.in',
            from: ['client-blank-comments@quezx.com', 'QuezX.com'],
            domain: 'Quezx.com',
            emailFormat: 'html',
            template: ['blankCommentApplicant'],
          },
          vars: {
            data: {
              message: options.comment,
              id: options.applicant.id,
              applicant_name: options.applicant.name,
            },
            server: 'app.quezx.com',
          },
        });

        return this.create({
          jobType: 'Email',
          group: 'low',
          data,
        });
      },
    },
  });

  return QueuedTask;
};
