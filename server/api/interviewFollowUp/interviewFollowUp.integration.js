'use strict';

var app = require('../..');
import request from 'supertest';

var newInterviewFollowUp;

describe('InterviewFollowUp API:', function() {

  describe('GET /api/interviewFollowUps', function() {
    var interviewFollowUps;

    beforeEach(function(done) {
      request(app)
        .get('/api/interviewFollowUps')
        .expect(200)
        .expect('Content-Type', /json/)
        .end((err, res) => {
          if (err) {
            return done(err);
          }
          interviewFollowUps = res.body;
          done();
        });
    });

    it('should respond with JSON array', function() {
      interviewFollowUps.should.be.instanceOf(Array);
    });

  });

  describe('POST /api/interviewFollowUps', function() {
    beforeEach(function(done) {
      request(app)
        .post('/api/interviewFollowUps')
        .send({
          name: 'New InterviewFollowUp',
          info: 'This is the brand new interviewFollowUp!!!'
        })
        .expect(201)
        .expect('Content-Type', /json/)
        .end((err, res) => {
          if (err) {
            return done(err);
          }
          newInterviewFollowUp = res.body;
          done();
        });
    });

    it('should respond with the newly created interviewFollowUp', function() {
      newInterviewFollowUp.name.should.equal('New InterviewFollowUp');
      newInterviewFollowUp.info.should.equal('This is the brand new interviewFollowUp!!!');
    });

  });

  describe('GET /api/interviewFollowUps/:id', function() {
    var interviewFollowUp;

    beforeEach(function(done) {
      request(app)
        .get('/api/interviewFollowUps/' + newInterviewFollowUp._id)
        .expect(200)
        .expect('Content-Type', /json/)
        .end((err, res) => {
          if (err) {
            return done(err);
          }
          interviewFollowUp = res.body;
          done();
        });
    });

    afterEach(function() {
      interviewFollowUp = {};
    });

    it('should respond with the requested interviewFollowUp', function() {
      interviewFollowUp.name.should.equal('New InterviewFollowUp');
      interviewFollowUp.info.should.equal('This is the brand new interviewFollowUp!!!');
    });

  });

  describe('PUT /api/interviewFollowUps/:id', function() {
    var updatedInterviewFollowUp;

    beforeEach(function(done) {
      request(app)
        .put('/api/interviewFollowUps/' + newInterviewFollowUp._id)
        .send({
          name: 'Updated InterviewFollowUp',
          info: 'This is the updated interviewFollowUp!!!'
        })
        .expect(200)
        .expect('Content-Type', /json/)
        .end(function(err, res) {
          if (err) {
            return done(err);
          }
          updatedInterviewFollowUp = res.body;
          done();
        });
    });

    afterEach(function() {
      updatedInterviewFollowUp = {};
    });

    it('should respond with the updated interviewFollowUp', function() {
      updatedInterviewFollowUp.name.should.equal('Updated InterviewFollowUp');
      updatedInterviewFollowUp.info.should.equal('This is the updated interviewFollowUp!!!');
    });

  });

  describe('DELETE /api/interviewFollowUps/:id', function() {

    it('should respond with 204 on successful removal', function(done) {
      request(app)
        .delete('/api/interviewFollowUps/' + newInterviewFollowUp._id)
        .expect(204)
        .end((err, res) => {
          if (err) {
            return done(err);
          }
          done();
        });
    });

    it('should respond with 404 when interviewFollowUp does not exist', function(done) {
      request(app)
        .delete('/api/interviewFollowUps/' + newInterviewFollowUp._id)
        .expect(404)
        .end((err, res) => {
          if (err) {
            return done(err);
          }
          done();
        });
    });

  });

});
