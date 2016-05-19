

var express = require('express');
var controller = require('./comment.controller');

var router = express.Router();

router.get('/:applicantId/comments', controller.index);
router.post('/:applicantId/comments', controller.create);
router.post('/:applicantId/comments/:commentId/interviewFollowUps', controller.interviewFollowUps);

module.exports = router;
