

var express = require('express');
var controller = require('./client.controller');

var router = express.Router();

// router.get('/', controller.index);
router.get('/preferences', controller.preferences);
router.get('/billing', controller.billing);
router.post('/billing', controller.billingUpdate);
router.get('/company', controller.company);
router.get('/getEmpRange', controller.getEmpRange);
router.post('/company', controller.companyUpdate);
router.get('/profile', controller.profile);
router.post('/profile', controller.profileUpdate);
router.get('/dashboard/actionCounts', controller.actionCounts);
router.get('/dashboard/ratingAndRatios', controller.ratingAndRatios);
router.get('/dashboard/forActions', controller.forActions);
router.get('/dashboard/upcomingOffers', controller.upcomingOffers);
router.get('/dashboard/upcomingInterviews', controller.upcomingInterviews);
router.get('/dashboard/latestProfiles', controller.latestProfiles);
router.get('/checkTerminationStatus', controller.checkTerminationStatus);
router.post('/makeUserActive', controller.makeUserActive);
router.get('/agreement', controller.agreement);
router.post('/acceptAgreement', controller.makeUserActive);
router.post('/updatePreferences', controller.updatePreferences);
// router.get('/:id', controller.show);
// router.post('/', controller.create);
// router.put('/:id', controller.update);
// router.patch('/:id', controller.update);
// router.delete('/:id', controller.destroy);

module.exports = router;
