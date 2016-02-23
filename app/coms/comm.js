var path = require('path'),
  logger = require('./log');

module.exports = function(scope, config) {

  scope.app_require = function(moduleName) {
    return require(path.join(config.root, path.sep, 'app', path.sep, moduleName));
  };

  scope.log_from = function(options) {
    return logger(options);
  };

};
