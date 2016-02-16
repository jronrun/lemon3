var path = require('path'),
    rootPath = path.normalize(__dirname + '/..'),
    env = process.env.NODE_ENV || 'development';

var config = {
  development: {
    root: rootPath,
    app: {
      name: 'lemon3'
    },
    port: 3000,
    webpackPort: 8080,
    inspectorWebPort: 8000,
    inspectorDebugPort: 5858,
    host: 'localhost'
  },

  test: {
    root: rootPath,
    app: {
      name: 'lemon3'
    },
    port: 3000,
  },

  production: {
    root: rootPath,
    app: {
      name: 'lemon3'
    },
    port: 3000,
  }
};

module.exports = config[env];
