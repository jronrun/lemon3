'use strict';

var format = require('util').format;

var host = '10.0.4.35';
//var host = '192.168.20.19';
//var host = 'localhost';
//var host = '192.168.1.102';

module.exports = {
  //'mongodb://localhost/noobjs_dev'
  db: 'mongodb://lemon3:kfvahtmgtlemon3@' + host + ':27017/lemon3',
  morganFmt: 'dev',
  port: 3000,

  webpackPort: 8080,
  inspectorWebPort: 8000,
  inspectorDebugPort: 5858,
  host: host,
  livereload: format('http://%s:35729/livereload.js', host)
};
