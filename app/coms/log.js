'use strict';

var bunyan = require('bunyan'),
  RotatingFileStream = require('bunyan-rotating-file-stream'),
  _ = require('lodash');

var COMM_LOG_CONFIG = {
  streams: [
    {
      level: 'debug',
      stream: process.stdout
    },
    {
      //bunyan ./logs/lemon.log -c 'this.text=="hell"' -l warn
      level: 'info',
      stream: new RotatingFileStream({
        path: './logs/lemon.log',
        period: '1d',          // daily rotation
        totalFiles: 10,        // keep 10 back copies
        rotateExisting: true,  // Give ourselves a clean file when we start up, based on period
        threshold: '10m',       // Rotate log files larger than 10 megabytes
        totalSize: '20m',       // Don't keep more than 20mb of archived log files
        gzip: true             // Compress the archive log files to save space
      })
    }
  ],
  src: true
};

module.exports = function(options, defineNew) {
  if (_.isString(options)) {
    options = { name: options };
  }

  return bunyan.createLogger(_.extend(defineNew ? {} : COMM_LOG_CONFIG, options || {}));
};
