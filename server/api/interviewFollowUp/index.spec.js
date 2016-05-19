'use strict';

var proxyquire = require('proxyquire').noPreserveCache();

var interviewFollowUpCtrlStub = {
  index: 'interviewFollowUpCtrl.index',
  show: 'interviewFollowUpCtrl.show',
  create: 'interviewFollowUpCtrl.create',
  update: 'interviewFollowUpCtrl.update',
  destroy: 'interviewFollowUpCtrl.destroy'
};

var routerStub = {
  get: sinon.spy(),
  put: sinon.spy(),
  patch: sinon.spy(),
  post: sinon.spy(),
  delete: sinon.spy()
};

// require the index with our stubbed out modules
var interviewFollowUpIndex = proxyquire('./index.js', {
  'express': {
    Router: function() {
      return routerStub;
    }
  },
  './interviewFollowUp.controller': interviewFollowUpCtrlStub
});

describe('InterviewFollowUp API Router:', function() {

  it('should return an express router instance', function() {
    interviewFollowUpIndex.should.equal(routerStub);
  });

  describe('GET /api/interviewFollowUps', function() {

    it('should route to interviewFollowUp.controller.index', function() {
      routerStub.get
        .withArgs('/', 'interviewFollowUpCtrl.index')
        .should.have.been.calledOnce;
    });

  });

  describe('GET /api/interviewFollowUps/:id', function() {

    it('should route to interviewFollowUp.controller.show', function() {
      routerStub.get
        .withArgs('/:id', 'interviewFollowUpCtrl.show')
        .should.have.been.calledOnce;
    });

  });

  describe('POST /api/interviewFollowUps', function() {

    it('should route to interviewFollowUp.controller.create', function() {
      routerStub.post
        .withArgs('/', 'interviewFollowUpCtrl.create')
        .should.have.been.calledOnce;
    });

  });

  describe('PUT /api/interviewFollowUps/:id', function() {

    it('should route to interviewFollowUp.controller.update', function() {
      routerStub.put
        .withArgs('/:id', 'interviewFollowUpCtrl.update')
        .should.have.been.calledOnce;
    });

  });

  describe('PATCH /api/interviewFollowUps/:id', function() {

    it('should route to interviewFollowUp.controller.update', function() {
      routerStub.patch
        .withArgs('/:id', 'interviewFollowUpCtrl.update')
        .should.have.been.calledOnce;
    });

  });

  describe('DELETE /api/interviewFollowUps/:id', function() {

    it('should route to interviewFollowUp.controller.destroy', function() {
      routerStub.delete
        .withArgs('/:id', 'interviewFollowUpCtrl.destroy')
        .should.have.been.calledOnce;
    });

  });

});
