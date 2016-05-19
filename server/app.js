/**
 * Main application file
 */

import express from 'express';
import sqldb from './sqldb';
import config from './config/environment';
import http from 'http';
import slack from './components/slack/index.js';

// Populate databases with sample data
//if (config.seedDB) { require('./config/seed'); }

if (!Promise.prototype.spread) {
  Promise.prototype.spread = function (fn) {
    return this.then(args => Promise.all(args)) // wait for all
      .then(args => fn.apply(this, args));
    // this is always undefined in A+ complaint, but just in case
  };
}

// Setup server
var app = express();
var server = http.createServer(app);
require('./config/express')(app);
require('./routes')(app);

// Start server
function startServer() {
  app.angularFullstack = server.listen(config.port, config.ip, function() {
    console.log('Express server listening on %d, in %s mode', config.port, app.get('env'));
  });
}
startServer()
// Expose app
exports = module.exports = app;
