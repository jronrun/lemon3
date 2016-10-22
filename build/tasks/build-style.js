'use strict';

module.exports.task = function (gulp, plugins, config, callback) {
  gulp.src('./public/css/*.scss')
    .pipe(
      plugins.sass({
        outputStyle: ('production' == process.env.NODE_ENV ? 'compressed' : '')
      })
        .on('error', plugins.sass.logError)
    )
    .pipe(plugins.autoprefixer())
    .pipe(gulp.dest('./public/dist/css'))

    .on('finish', function () {
      callback();
    });
};

module.exports.deps = ['build-clean'];
