/**
 * FollowUpOption model events
 */

'use strict';

import {EventEmitter} from 'events';
var FollowUpOption = require('../../sqldb').FollowUpOption;
var FollowUpOptionEvents = new EventEmitter();

// Set max event listeners (0 == unlimited)
FollowUpOptionEvents.setMaxListeners(0);

// Model events
var events = {
  'afterCreate': 'save',
  'afterUpdate': 'save',
  'afterDestroy': 'remove'
};

// Register the event emitter to the model events
for (var e in events) {
  var event = events[e];
  FollowUpOption.hook(e, emitEvent(event));
}

function emitEvent(event) {
  return function(doc, options, done) {
    FollowUpOptionEvents.emit(event + ':' + doc._id, doc);
    FollowUpOptionEvents.emit(event, doc);
    done(null);
  }
}

export default FollowUpOptionEvents;
