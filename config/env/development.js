var format = require('util').format;

var host = '10.0.4.35'; //'192.168.20.19'

module.exports = {
  morganFmt: 'dev',
  port: 3000,

  webpackPort: 8080,
  inspectorWebPort: 8000,
  inspectorDebugPort: 5858,
  host: host,
  livereload: format('http://%s:35729/livereload.js', host)
};
