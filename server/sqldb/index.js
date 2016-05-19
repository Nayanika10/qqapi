/**
 * Sequelize initialization module
 */

import config from '../config/environment';
import Sequelize from 'sequelize';
import solrClient from 'solr-client';
import Bluebird from 'bluebird';
import BUCKETS from './../config/buckets';
import STAKEHOLDERS from './../config/stakeholders';

const db = {
  Sequelize,
  BUCKETS,
  STAKEHOLDERS,
  Solr: solrClient.createClient(
    config.solr.host, config.solr.port,
    config.solr.core, config.solr.path
  ),
  sequelizeQuarc: new Sequelize(
    config.quarc.database, config.quarc.username,
    config.quarc.password, config.quarc
  ),
  sequelizeQuantum: new Sequelize(
    config.quantum.database, config.quantum.username,
    config.quantum.password, config.quantum
  ),
};

// Quarc - Insert models below
db.ActionableState = db.sequelizeQuarc.import('../api/actionableState/actionableState.model');
db.Applicant = db.sequelizeQuarc.import('../api/applicant/applicant.model');
db.ApplicantDownload = db.sequelizeQuarc.import('../api/applicantDownload/applicantDownload.model');
db.ApplicantScoreLog = db.sequelizeQuarc.import('../api/applicantScoreLog/applicantScoreLog.model');
db.ApplicantSkill = db.sequelizeQuarc.import('../api/applicantSkill/applicantSkill.model');
db.ApplicantState = db.sequelizeQuarc.import('../api/applicantState/applicantState.model');
db.ApplicantView = db.sequelizeQuarc.import('../api/applicantView/applicantView.model');
db.ClientPreferredFunction = db.sequelizeQuarc.import('../api/clientPreferredFunction/clientPreferredFunction.model');
db.ClientPreferredIndustry = db.sequelizeQuarc.import('../api/clientPreferredIndustry/clientPreferredIndustry.model');
db.Comment = db.sequelizeQuarc.import('../api/comment/comment.model');
db.Education = db.sequelizeQuarc.import('../api/education/education.model');
db.Email = db.sequelizeQuarc.import('../api/email/email.model');
db.Experience = db.sequelizeQuarc.import('../api/experience/experience.model');
db.Follower = db.sequelizeQuarc.import('../api/follower/follower.model');
db.FollowerAccess = db.sequelizeQuarc.import('../api/followerAccess/followerAccess.model');
db.FollowerType = db.sequelizeQuarc.import('../api/followerType/followerType.model');
db.Hotline = db.sequelizeQuarc.import('../api/hotline/hotline.model');
db.Job = db.sequelizeQuarc.import('../api/job/job.model');
db.JobAllocation = db.sequelizeQuarc.import('../api/jobAllocation/jobAllocation.model');
db.JobApplication = db.sequelizeQuarc.import('../api/jobApplication/jobApplication.model');
db.JobComment = db.sequelizeQuarc.import('../api/jobComment/jobComment.model');
db.JobContent = db.sequelizeQuarc.import('../api/jobContent/jobContent.model');
db.JobDownload = db.sequelizeQuarc.import('../api/jobDownload/jobDownload.model');
db.JobScore = db.sequelizeQuarc.import('../api/jobScore/jobScore.model');
db.JobsDegree = db.sequelizeQuarc.import('../api/jobsDegree/jobsDegree.model');
db.JobsEmployer = db.sequelizeQuarc.import('../api/jobsEmployer/jobsEmployer.model');
db.JobsIndustry = db.sequelizeQuarc.import('../api/jobsIndustry/jobsIndustry.model');
db.JobsInstitute = db.sequelizeQuarc.import('../api/jobsInstitute/jobsInstitute.model');
db.JobSkill = db.sequelizeQuarc.import('../api/jobSkill/jobSkill.model');
db.JobStatus = db.sequelizeQuarc.import('../api/jobStatus/jobStatus.model');
db.JobStatusLog = db.sequelizeQuarc.import('../api/jobStatusLog/jobStatusLog.model');
db.JobView = db.sequelizeQuarc.import('../api/jobView/jobView.model');
db.Notification = db.sequelizeQuarc.import('../api/notification/notification.model');
db.PhoneNumber = db.sequelizeQuarc.import('../api/phoneNumber/phoneNumber.model');
db.QueuedTask = db.sequelizeQuarc.import('../api/queuedTask/queuedTask.model');
db.Referral = db.sequelizeQuarc.import('../api/referral/referral.model');
db.Resume = db.sequelizeQuarc.import('../api/resume/resume.model');
db.State = db.sequelizeQuarc.import('../api/state/state.model');
db.UsageLog = db.sequelizeQuarc.import('../api/usageLog/usageLog.model');
db.Reference  = db.sequelizeQuarc.import('../api/reference/reference.model');
db.ConsultantResponse = db.sequelizeQuarc.import('../api/consultantResponse/consultantResponse.model');
db.Response = db.sequelizeQuarc.import('../api/response/response.model');
db.Log = db.sequelizeQuarc.import('../api/log/log.model');
db.ClientPayment = db.sequelizeQuarc.import('../api/clientPayment/clientPayment.model');
db.ClientPaymentMap = db.sequelizeQuarc.import('../api/clientPaymentMap/clientPaymentMap.model');
db.ClientPaymentDesignation = db.sequelizeQuarc.import('../api/clientPaymentDesignation/clientPaymentDesignation.model');
db.Agreement = db.sequelizeQuarc.import('../api/agreement/agreement.model');
db.ApplicantPreferenceTime = db.sequelizeQuarc.import('../api/applicantPreferenceTime/applicantPreferenceTime.model');
db.ApplicantScreening = db.sequelizeQuarc.import('../api/applicantScreening/applicantScreening.model');
db.ScreeningState = db.sequelizeQuarc.import('../api/screeningState/screeningState.model');
db.FollowUpOption = db.sequelizeQuarc.import('../api/followUpOption/followUpOption.model');
db.InterviewFollowUp = db.sequelizeQuarc.import('../api/interviewFollowUp/interviewFollowUp.model');

db.AccessToken = db.sequelizeQuantum.import('../api/accessToken/accessToken.model');
db.App = db.sequelizeQuantum.import('../api/app/app.model');
db.AuthCode = db.sequelizeQuantum.import('../api/authCode/authCode.model');
db.Client = db.sequelizeQuantum.import('../api/client/client.model');
db.Degree = db.sequelizeQuantum.import('../api/degree/degree.model');
db.Designation = db.sequelizeQuantum.import('../api/designation/designation.model');
db.Employer = db.sequelizeQuantum.import('../api/employer/employer.model');
db.Endpoint = db.sequelizeQuantum.import('../api/endpoint/endpoint.model');
db.Func = db.sequelizeQuantum.import('../api/func/func.model');
db.Group = db.sequelizeQuantum.import('../api/group/group.model');
db.Industry = db.sequelizeQuantum.import('../api/industry/industry.model');
db.Institute = db.sequelizeQuantum.import('../api/institute/institute.model');
db.ItemScope = db.sequelizeQuantum.import('../api/itemScope/itemScope.model');
db.Logo = db.sequelizeQuantum.import('../api/logo/logo.model');
db.PaymentMethod = db.sequelizeQuantum.import('../api/paymentMethod/paymentMethod.model');
db.Province = db.sequelizeQuantum.import('../api/province/province.model');
db.RefreshToken = db.sequelizeQuantum.import('../api/refreshToken/refreshToken.model');
db.Region = db.sequelizeQuantum.import('../api/region/region.model');
db.Scope = db.sequelizeQuantum.import('../api/scope/scope.model');
db.Skill = db.sequelizeQuantum.import('../api/skill/skill.model');
db.User = db.sequelizeQuantum.import('../api/user/user.model');
db.UserTawktoToken = db.sequelizeQuantum.import('../api/userTawktoToken/userTawktoToken.model');
db.EntityType = db.sequelizeQuantum.import('../api/entityType/entityType.model');


// Dashboard App
db.bdQuery = db.sequelizeQuarc.import('../applications/dashboard/api/bdQuery/bdQuery.model');

Object.keys(db).forEach(modelName => {
  if ('associate' in db[modelName]) {
    db[modelName].associate(db);
  }
});

// Proxy
db.Welcome = db.Reference;

Bluebird.promisifyAll(Object.getPrototypeOf(db.Solr));

export default db;
