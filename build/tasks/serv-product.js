'use strict';

var bunyan = require('bunyan'),
  spawn = require('child_process').spawn;

module.exports.task = function (gulp, plugins, config) {
  plugins.nodemon({
    script: 'app.js',
    ext: 'js coffee jade',
    stdout: false,
    readable: false
  }).on('readable', function () {
    bunyan = spawn('./node_modules/bunyan/bin/bunyan', [
      '--output', 'short', '--color'
    ]);

    bunyan.stdout.pipe(process.stdout);
    bunyan.stderr.pipe(process.stderr);

    this.stdout.pipe(bunyan.stdin);
    this.stderr.pipe(bunyan.stdin);
  });
};

module.exports.deps = ['env-product', 'build-webpack'];
