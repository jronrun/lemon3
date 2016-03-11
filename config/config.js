'use strict';

var path = require('path'),
    extend = require('util')._extend;

var development = require('./env/development');
var test = require('./env/test');
var production = require('./env/production');
var pkg = require('../package.json');

var defaults = {
  root: path.normalize(__dirname + '/..'),
  pkg: pkg,
  app: {
    name: pkg.name
  }
};

module.exports = {
  development: extend(development, defaults),
  test: extend(test, defaults),
  production: extend(production, defaults)
} [process.env.NODE_ENV || 'development'];

