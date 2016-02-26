var path = require('path'),
    extend = require('util')._extend;

var development = require('./env/development');
var test = require('./env/test');
var production = require('./env/production');
var appName = require('../package.json').name;

var defaults = {
  root: path.normalize(__dirname + '/..'),
  app: {
    name: appName
  }
};

module.exports = {
  development: extend(development, defaults),
  test: extend(test, defaults),
  production: extend(production, defaults)
}[process.env.NODE_ENV || 'development'];

