

var express = require('express');
var controller = require('./client.controller');

var router = express.Router();

router.get('/', controller.index);
router.get('/preferences', controller.preferences);
router.get('/dashboard', controller.dashboard);
router.get('/checkTerminationStatus', controller.checkTerminationStatus);
router.post('/makeUserActive', controller.makeUserActive);
router.get('/agreement', controller.agreement);
router.post('/acceptAgreement', controller.makeUserActive);
router.post('/updatePreferences', controller.updatePreferences);
//router.get('/:id', controller.show);
//router.post('/', controller.create);
//router.put('/:id', controller.update);
//router.patch('/:id', controller.update);
//router.delete('/:id', controller.destroy);

module.exports = router;
