'use strict';

module.exports.task = function (gulp, plugins, config) {
  gulp.src([
    './public/components/pickadate/lib/picker.js',
    './public/components/pickadate/lib/picker.date.js',
    './public/components/pickadate/lib/picker.time.js'
  ])
    .pipe(plugins.sourcemaps.init())
    .pipe(plugins.concat('picker.js'))
    .pipe(plugins.sourcemaps.write())
    .pipe(gulp.dest('./public/dist/'));

  gulp.src([
      './public/components/pickadate/lib/themes/default.css',
      './public/components/pickadate/lib/themes/default.date.css',
      './public/components/pickadate/lib/themes/default.time.css'
    ])
    .pipe(plugins.concat('picker.css'))
    .pipe(gulp.dest('./public/dist/'));
};
