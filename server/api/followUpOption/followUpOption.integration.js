'use strict';

var app = require('../..');
import request from 'supertest';

var newFollowUpOption;

describe('FollowUpOption API:', function() {

  describe('GET /api/followUpOptions', function() {
    var followUpOptions;

    beforeEach(function(done) {
      request(app)
        .get('/api/followUpOptions')
        .expect(200)
        .expect('Content-Type', /json/)
        .end((err, res) => {
          if (err) {
            return done(err);
          }
          followUpOptions = res.body;
          done();
        });
    });

    it('should respond with JSON array', function() {
      followUpOptions.should.be.instanceOf(Array);
    });

  });

  describe('POST /api/followUpOptions', function() {
    beforeEach(function(done) {
      request(app)
        .post('/api/followUpOptions')
        .send({
          name: 'New FollowUpOption',
          info: 'This is the brand new followUpOption!!!'
        })
        .expect(201)
        .expect('Content-Type', /json/)
        .end((err, res) => {
          if (err) {
            return done(err);
          }
          newFollowUpOption = res.body;
          done();
        });
    });

    it('should respond with the newly created followUpOption', function() {
      newFollowUpOption.name.should.equal('New FollowUpOption');
      newFollowUpOption.info.should.equal('This is the brand new followUpOption!!!');
    });

  });

  describe('GET /api/followUpOptions/:id', function() {
    var followUpOption;

    beforeEach(function(done) {
      request(app)
        .get('/api/followUpOptions/' + newFollowUpOption._id)
        .expect(200)
        .expect('Content-Type', /json/)
        .end((err, res) => {
          if (err) {
            return done(err);
          }
          followUpOption = res.body;
          done();
        });
    });

    afterEach(function() {
      followUpOption = {};
    });

    it('should respond with the requested followUpOption', function() {
      followUpOption.name.should.equal('New FollowUpOption');
      followUpOption.info.should.equal('This is the brand new followUpOption!!!');
    });

  });

  describe('PUT /api/followUpOptions/:id', function() {
    var updatedFollowUpOption;

    beforeEach(function(done) {
      request(app)
        .put('/api/followUpOptions/' + newFollowUpOption._id)
        .send({
          name: 'Updated FollowUpOption',
          info: 'This is the updated followUpOption!!!'
        })
        .expect(200)
        .expect('Content-Type', /json/)
        .end(function(err, res) {
          if (err) {
            return done(err);
          }
          updatedFollowUpOption = res.body;
          done();
        });
    });

    afterEach(function() {
      updatedFollowUpOption = {};
    });

    it('should respond with the updated followUpOption', function() {
      updatedFollowUpOption.name.should.equal('Updated FollowUpOption');
      updatedFollowUpOption.info.should.equal('This is the updated followUpOption!!!');
    });

  });

  describe('DELETE /api/followUpOptions/:id', function() {

    it('should respond with 204 on successful removal', function(done) {
      request(app)
        .delete('/api/followUpOptions/' + newFollowUpOption._id)
        .expect(204)
        .end((err, res) => {
          if (err) {
            return done(err);
          }
          done();
        });
    });

    it('should respond with 404 when followUpOption does not exist', function(done) {
      request(app)
        .delete('/api/followUpOptions/' + newFollowUpOption._id)
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
