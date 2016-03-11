'use strict';

var path = require('path'),
  logger = require('./log'),
  mongo = require('./mongo'),
  _ = require('lodash'),
  when = require('when'),
  async = require('async'),
  revalidator = require('revalidator');

var extend_lodash = {
  startsIf: function (target, start) {
    return _.startsWith(target, start) ? target : (start + target);
  },

  endsIf: function (target, end) {
    return _.endsWith(target, end) ? target : (target + end);
  },

  aroundWith: function (target, around) {
    return _.startsWith(target, around) && _.endsWith(target, around);
  },

  aroundIf: function (target, around) {
    return _.endsIf(_.startsIf(target, around), around);
  },

  beforeOccur: function(target, delimiter, position) {
    var tokens = target.split(delimiter).slice(position);
    return delimiter + tokens.join(delimiter);
  }
};

module.exports = function(scope, config) {

  scope._ = _;
  _.extend(_, extend_lodash);

  scope.when = when;
  scope.async = async;
  scope.schema = function(target) {
    target = target.properties ? target : {
      properties: target
    };

    return function(object) {
      return revalidator.validate(object, target);
    };
  };

  scope.app_require = function(moduleName) {
    return require(path.join(config.root, path.sep, 'app', path.sep, moduleName));
  };

  scope.log_from = function(options) {
    return logger(options);
  };

  scope.database = function() {
    return mongo.db;
  };

  scope.model_bind = function(modelName, methods) {
    var model = database().bind(modelName);
    model.bind(_.extend(mongo.Base(model, modelName), methods || {}));
    return model;
  };

  var resource = require('./resource');
  scope.getResource = resource.getResource;
  scope.routes = resource.resource;

};
