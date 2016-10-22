'use strict';

module.exports.task = function (gulp, plugins, config, callback) {
  gulp.src('./public/dist', {
    read: false
  }).pipe(plugins.clean())

    .on('finish', function () {
      callback();
    });
};
