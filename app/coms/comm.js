var path = require('path'),
  logger = require('./log'),
  mongo = require('./mongo'),
  _ = require('lodash'),
  when = require('when');

module.exports = function(scope, config) {

  scope._ = _;
  scope.when = when;

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

};
