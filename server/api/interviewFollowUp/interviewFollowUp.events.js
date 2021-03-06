/**
 * InterviewFollowUp model events
 */

'use strict';

import {EventEmitter} from 'events';
var InterviewFollowUp = require('../../sqldb').InterviewFollowUp;
var InterviewFollowUpEvents = new EventEmitter();

// Set max event listeners (0 == unlimited)
InterviewFollowUpEvents.setMaxListeners(0);

// Model events
var events = {
  'afterCreate': 'save',
  'afterUpdate': 'save',
  'afterDestroy': 'remove'
};

// Register the event emitter to the model events
for (var e in events) {
  var event = events[e];
  InterviewFollowUp.hook(e, emitEvent(event));
}

function emitEvent(event) {
  return function(doc, options, done) {
    InterviewFollowUpEvents.emit(event + ':' + doc._id, doc);
    InterviewFollowUpEvents.emit(event, doc);
    done(null);
  }
}

export default InterviewFollowUpEvents;
