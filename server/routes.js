/**
 * Main application routes
 */

'use strict';

import errors from './components/errors';
import path from 'canonical-path';

export default function(app) {

  // Insert routes below
  app.use('/api/interviewFollowUps', require('./api/interviewFollowUp'));
  app.use('/api/followUpOptions', require('./api/followUpOption'));
  app.use('/api/entityTypes', require('./api/entityType'));
  app.use('/api/clientPaymentDesignations', app.oauth.authenticate(), require('./api/clientPaymentDesignation'));
  app.use('/api/agreements', app.oauth.authenticate(), require('./api/agreement'));
  app.use('/api/clientPaymentMaps', app.oauth.authenticate(), require('./api/clientPaymentMap'));
  app.use('/api/userTawktoTokens', app.oauth.authenticate(), require('./api/userTawktoToken'));
  app.use('/api/screeningStates', app.oauth.authenticate(), require('./api/screeningState'));
  app.use('/api/applicantScreenings', app.oauth.authenticate(), require('./api/applicantScreening'));
  app.use('/api/applicantPreferenceTimes', app.oauth.authenticate(), require('./api/applicantPreferenceTime'));
  app.use('/api/references', app.oauth.authenticate(), require('./api/reference'));
  app.use('/api/clientPayments', app.oauth.authenticate(), require('./api/clientPayment'));
  app.use('/api/logs', app.oauth.authenticate(), require('./api/log'));
  app.use('/api/responses', app.oauth.authenticate(), require('./api/response'));
  app.use('/api/consultantResponses', app.oauth.authenticate(), require('./api/consultantResponse'));
  app.use('/api/search', require('./api/search'));
  app.use('/api/applicants', app.oauth.authenticate(), require('./api/applicant/comment'));
  app.use('/api/welcomes', app.oauth.authenticate(), require('./api/welcome'));
  app.use('/api/applicantViews', app.oauth.authenticate(), require('./api/applicantView'));
  app.use('/api/usageLogs', app.oauth.authenticate(), require('./api/usageLog'));
  app.use('/api/resumes', app.oauth.authenticate(), require('./api/resume'));
  app.use('/api/queuedTasks', app.oauth.authenticate(), require('./api/queuedTask'));
  app.use('/api/referrals', app.oauth.authenticate(), require('./api/referral'));
  app.use('/api/phoneNumbers', app.oauth.authenticate(), require('./api/phoneNumber'));
  app.use('/api/notifications', app.oauth.authenticate(), require('./api/notification'));
  app.use('/api/jobViews', app.oauth.authenticate(), require('./api/jobView'));
  app.use('/api/jobStatusLogs', app.oauth.authenticate(), require('./api/jobStatusLog'));
  app.use('/api/jobStatus', app.oauth.authenticate(), require('./api/jobStatus'));
  app.use('/api/jobSkills', app.oauth.authenticate(), require('./api/jobSkill'));
  app.use('/api/jobsInstitutes', app.oauth.authenticate(), require('./api/jobsInstitute'));
  app.use('/api/jobsIndustries', app.oauth.authenticate(), require('./api/jobsIndustry'));
  app.use('/api/jobsEmployers', app.oauth.authenticate(), require('./api/jobsEmployer'));
  app.use('/api/jobsDegrees', app.oauth.authenticate(), require('./api/jobsDegree'));
  app.use('/api/jobScores', app.oauth.authenticate(), require('./api/jobScore'));
  app.use('/api/jobDownloads', app.oauth.authenticate(), require('./api/jobDownload'));
  app.use('/api/jobContents', app.oauth.authenticate(), require('./api/jobContent'));
  app.use('/api/jobApplications', app.oauth.authenticate(), require('./api/jobApplication'));
  app.use('/api/hotlines', app.oauth.authenticate(), require('./api/hotline'));
  app.use('/api/followerTypes', app.oauth.authenticate(), require('./api/followerType'));
  app.use('/api/followerAccess', app.oauth.authenticate(), require('./api/followerAccess'));
  app.use('/api/followers', app.oauth.authenticate(), require('./api/follower'));
  app.use('/api/experiences', app.oauth.authenticate(), require('./api/experience'));
  app.use('/api/emails', app.oauth.authenticate(), require('./api/email'));
  app.use('/api/educations', app.oauth.authenticate(), require('./api/education'));
  app.use('/api/clientPreferredIndustries', app.oauth.authenticate(), require('./api/clientPreferredIndustry'));
  app.use('/api/clientPreferredFunctions', app.oauth.authenticate(), require('./api/clientPreferredFunction'));
  app.use('/api/applicantSkills', app.oauth.authenticate(), require('./api/applicantSkill'));
  app.use('/api/applicantScoreLogs', app.oauth.authenticate(), require('./api/applicantScoreLog'));
  app.use('/api/regions', app.oauth.authenticate(), require('./api/region'));
  app.use('/api/paymentMethods', app.oauth.authenticate(), require('./api/paymentMethod'));
  app.use('/api/institutes', app.oauth.authenticate(), require('./api/institute'));
  app.use('/api/funcs', app.oauth.authenticate(), require('./api/func'));
  app.use('/api/designations', app.oauth.authenticate(), require('./api/designation'));
  app.use('/api/authCodes', app.oauth.authenticate(), require('./api/authCode'));
  app.use('/api/skills', app.oauth.authenticate(), require('./api/skill'));
  app.use('/api/refreshTokens', app.oauth.authenticate(), require('./api/refreshToken'));
  app.use('/api/logos', app.oauth.authenticate(), require('./api/logo'));
  app.use('/api/industries', app.oauth.authenticate(), require('./api/industry'));
  app.use('/api/endpoints', app.oauth.authenticate(), require('./api/endpoint'));
  app.use('/api/degrees', app.oauth.authenticate(), require('./api/degree'));
  app.use('/api/apps', app.oauth.authenticate(), require('./api/app'));
  app.use('/api/scopes', app.oauth.authenticate(), require('./api/scope'));
  app.use('/api/provinces', app.oauth.authenticate(), require('./api/province'));
  app.use('/api/itemScopes', app.oauth.authenticate(), require('./api/itemScope'));
  app.use('/api/groups', app.oauth.authenticate(), require('./api/group'));
  app.use('/api/employers', app.oauth.authenticate(), require('./api/employer'));
  app.use('/api/clients', app.oauth.authenticate(), require('./api/client'));
  app.use('/api/accessTokens', app.oauth.authenticate(), require('./api/accessToken'));
  app.use('/api/applicantDownloads', app.oauth.authenticate(), require('./api/applicantDownload'));
  app.use('/api/states', app.oauth.authenticate(), require('./api/state'));
  app.use('/api/summary', app.oauth.authenticate(), require('./api/summary'));
  app.use('/api/jobComments', app.oauth.authenticate(), require('./api/jobComment'));
  app.use('/api/applicantStates', app.oauth.authenticate(), require('./api/applicantState'));
  app.use('/api/jobs', app.oauth.authenticate(), require('./api/job/comment'));
  app.use('/api/jobs', require('./api/job/applicant'));
  app.use('/api/jobAllocations', app.oauth.authenticate(), require('./api/jobAllocation'));
  app.use('/api/jobs', app.oauth.authenticate(), require('./api/job'));
  app.use('/api/jobs', app.oauth.authenticate(), require('./api/job/applicant'));
  app.use('/api/applicants', app.oauth.authenticate(), require('./api/applicant'));
  app.use('/api/partners', app.oauth.authenticate(), require('./api/partner'));
  app.use('/api/users', app.oauth.authenticate(), require('./api/user'));
  app.use('/user', app.oauth.authenticate(), require('./api/user/proxy.js'));
  app.use(app.oauth.errorHandler());
  // All undefined asset or api routes should return a 404
  app.route('/*').get(errors[404]);
}
