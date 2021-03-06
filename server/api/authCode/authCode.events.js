/**
 * AuthCode model events
 */



import { EventEmitter } from 'events';
var AuthCode = require('../../sqldb').AuthCode;
var AuthCodeEvents = new EventEmitter();

// Set max event listeners (0 == unlimited)
AuthCodeEvents.setMaxListeners(0);

// Model events
var events = {
  'afterCreate': 'save',
  'afterUpdate': 'save',
  'afterDestroy': 'remove',
};

// Register the event emitter to the model events
for (var e in events) {
  var event = events[e];
  AuthCode.hook(e, emitEvent(event));
}

function emitEvent(event) {
  return function (doc, options, done) {
    AuthCodeEvents.emit(event + ':' + doc._id, doc);
    AuthCodeEvents.emit(event, doc);
    done(null);
  };
}

export default AuthCodeEvents;
