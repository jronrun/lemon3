'use strict';

var format = require('util').format;

module.exports = {
  db: process.env.MONGOHQ_URL,
  morganFmt: 'dev',
  port: 3000,

  webpackPort: 8080,
  inspectorWebPort: 8000,
  inspectorDebugPort: 5858,
  host: process.env.LEMON3_HOST,
  livereload: format('http://%s:35729/livereload.js', process.env.LEMON3_HOST)
};
