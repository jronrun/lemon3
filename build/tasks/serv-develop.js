'use strict';

var bunyan = require('bunyan'),
  util = require('util'),
  spawn = require('child_process').spawn;

module.exports.task = function (gulp, plugins, config) {
  plugins.livereload.listen();
  plugins.nodemon({
    exec: util.format('node-inspector --web-host=%s --web-port=%s & node --debug=%s',
      config.host, config.inspectorWebPort, config.inspectorDebugPort),
    script: 'app.js',
    ext: 'js coffee jade html',
    stdout: false,
    readable: false
  }).on('readable', function () {
    this.stdout.on('data', function (chunk) {
      if (/^Express server listening on port/.test(chunk)) {
        plugins.livereload.changed(__dirname);
      }
    });

    bunyan = spawn('./node_modules/bunyan/bin/bunyan', [
      '--output', 'short', '--color'
    ]);

    bunyan.stdout.pipe(process.stdout);
    bunyan.stderr.pipe(process.stderr);

    this.stdout.pipe(bunyan.stdin);
    this.stderr.pipe(bunyan.stdin);

    //this.stdout.pipe(process.stdout);
    //this.stderr.pipe(process.stderr);
  });
};

module.exports.deps = [];
