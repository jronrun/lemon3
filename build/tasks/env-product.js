'use strict';

module.exports.task = function (gulp, plugins, config, callback) {
  process.env.NODE_ENV = 'production';

  callback();
};
