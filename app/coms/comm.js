var path = require('path'),
  logger = require('./log'),
  mongo = require('./mongo');

module.exports = function(scope, config) {

  scope.app_require = function(moduleName) {
    return require(path.join(config.root, path.sep, 'app', path.sep, moduleName));
  };

  scope.log_from = function(options) {
    return logger(options);
  };

  scope.database = function() {
    return mongo.db;
  };

  scope.model_bind = function(model, methods) {
    var model = database().bind(model);
    model.bind(methods || {});
    return model;
  };

};
