var path = require('path'),
    util = require('util'),
    rootPath = path.normalize(__dirname + '/..'),
    env = process.env.NODE_ENV || 'development';

var config = {
  development: {
    root: rootPath,
    morganFmt: 'dev',
    app: {
      name: 'lemon3'
    },
    port: 3000,
    webpackPort: 8080,
    inspectorWebPort: 8000,
    inspectorDebugPort: 5858,
    host: '10.0.4.35' //'192.168.20.19'
  },

  test: {
    root: rootPath,
    morganFmt: 'dev',
    app: {
      name: 'lemon3'
    },
    port: 3000
  },

  production: {
    root: rootPath,
    morganFmt: 'short',
    app: {
      name: 'lemon3'
    },
    port: 3000
  }
};

config.development.livereload = util.format('http://%s:35729/livereload.js', config.development.host);

module.exports = config[env];
