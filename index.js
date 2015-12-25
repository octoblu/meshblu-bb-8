'use strict';
var util = require('util');
var EventEmitter = require('events').EventEmitter;
var debug = require('debug')('meshblu-bb-8')
var _ = require('lodash');
var sphero = require("sphero");
var bb8;
var spheroReady = false;

var MESSAGE_SCHEMA = {
  type: 'object',
  properties: {
    roll: {
      type: 'boolean'
    },
    speed: {
      type: 'number',
      description: "0 - 150"
    },
    direction: {
      type: 'number',
      description: "0 - 360"
    },
    color: {
      type: 'boolean',
      default: false
    },
    red: {
      type: 'number',
      description: "0 - 255"
    },
    green: {
      type: 'number',
      description: "0 - 255"
    },
    blue: {
      type: 'number',
      description: "0 - 255"
    }
  }
};

var OPTIONS_SCHEMA = {
  type: 'object',
  properties: {
    ble_address: {
      type: 'string',
      required: true
    },
    report_collisions: {
      type: 'boolean',
      default: false
    },
    report_accel: {
      type: 'boolean',
      default: false
    },
    report_gyro: {
      type: 'boolean',
      default: false
    }
  }
};

function Plugin(){
  var self = this;
  self.options = {};
  self.messageSchema = MESSAGE_SCHEMA;
  self.optionsSchema = OPTIONS_SCHEMA;
  return self;
}
util.inherits(Plugin, EventEmitter);

Plugin.prototype.onMessage = function(message){
  var self = this;
  var payload = message.payload;
  if(spheroReady){
    if(payload.roll){
      bb8.roll(payload.speed, payload.direction);
    }
    if(payload.color){
      bb8.color({ red: payload.red, green: payload.green, blue: payload.blue })
    }
  }
};

Plugin.prototype.connectSphero = function(ble_address){
  var self = this;

  bb8 = sphero(ble_address);
  bb8.connect(function() {
    spheroReady = true;

    bb8.detectCollisions();
    bb8.streamAccelerometer();
    bb8.streamGyroscope();

    bb8.on("collision", function(data) {
      if(self.options.report_collisions){
        throttledEmit(data);
      }
    });

    bb8.on("accelerometer", function(data) {
      if(self.options.report_accel){
        throttledEmit(data);
      }
    });

    bb8.on("gyroscope", function(data) {
      if(self.options.report_gyro){
        throttledEmit(data);
      }
    });

  });

  var throttledEmit = _.throttle(function(payload){
    debug('throttled', payload);
    self.emit('message', {"devices": ['*'], "payload": payload});
  }, 300, {'leading': false});

};

Plugin.prototype.onConfig = function(device){
  var self = this;
  self.setOptions(device.options||{});
};

Plugin.prototype.setOptions = function(options){
  var self = this;
  if(self.options.ble_address != options.ble_address){
    self.options = options;
    this.connectSphero(options.ble_address);
  }
  self.options = options;
};

module.exports = {
  messageSchema: MESSAGE_SCHEMA,
  optionsSchema: OPTIONS_SCHEMA,
  Plugin: Plugin
};
