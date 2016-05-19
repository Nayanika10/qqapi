'use strict';

var proxyquire = require('proxyquire').noPreserveCache();

var followUpOptionCtrlStub = {
  index: 'followUpOptionCtrl.index',
  show: 'followUpOptionCtrl.show',
  create: 'followUpOptionCtrl.create',
  update: 'followUpOptionCtrl.update',
  destroy: 'followUpOptionCtrl.destroy'
};

var routerStub = {
  get: sinon.spy(),
  put: sinon.spy(),
  patch: sinon.spy(),
  post: sinon.spy(),
  delete: sinon.spy()
};

// require the index with our stubbed out modules
var followUpOptionIndex = proxyquire('./index.js', {
  'express': {
    Router: function() {
      return routerStub;
    }
  },
  './followUpOption.controller': followUpOptionCtrlStub
});

describe('FollowUpOption API Router:', function() {

  it('should return an express router instance', function() {
    followUpOptionIndex.should.equal(routerStub);
  });

  describe('GET /api/followUpOptions', function() {

    it('should route to followUpOption.controller.index', function() {
      routerStub.get
        .withArgs('/', 'followUpOptionCtrl.index')
        .should.have.been.calledOnce;
    });

  });

  describe('GET /api/followUpOptions/:id', function() {

    it('should route to followUpOption.controller.show', function() {
      routerStub.get
        .withArgs('/:id', 'followUpOptionCtrl.show')
        .should.have.been.calledOnce;
    });

  });

  describe('POST /api/followUpOptions', function() {

    it('should route to followUpOption.controller.create', function() {
      routerStub.post
        .withArgs('/', 'followUpOptionCtrl.create')
        .should.have.been.calledOnce;
    });

  });

  describe('PUT /api/followUpOptions/:id', function() {

    it('should route to followUpOption.controller.update', function() {
      routerStub.put
        .withArgs('/:id', 'followUpOptionCtrl.update')
        .should.have.been.calledOnce;
    });

  });

  describe('PATCH /api/followUpOptions/:id', function() {

    it('should route to followUpOption.controller.update', function() {
      routerStub.patch
        .withArgs('/:id', 'followUpOptionCtrl.update')
        .should.have.been.calledOnce;
    });

  });

  describe('DELETE /api/followUpOptions/:id', function() {

    it('should route to followUpOption.controller.destroy', function() {
      routerStub.delete
        .withArgs('/:id', 'followUpOptionCtrl.destroy')
        .should.have.been.calledOnce;
    });

  });

});
