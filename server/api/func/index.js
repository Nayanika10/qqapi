

var express = require('express');
var controller = require('./func.controller');

var router = express.Router();

router.get('/', controller.index);
router.get('/getFunctionList', controller.index);
// router.get('/:id', controller.show);
// router.post('/', controller.create);
// router.put('/:id', controller.update);
// router.patch('/:id', controller.update);
// router.delete('/:id', controller.destroy);

module.exports = router;
