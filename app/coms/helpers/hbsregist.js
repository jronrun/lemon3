'use strict';

var layouts = require('handlebars-layouts'),
  strings = require('./strings'),
  comparisons = require('./comparisons');

module.exports.register = function (handlebars, options) {
  options = options || {};

  handlebars.registerHelper(layouts(handlebars));
  comparisons.register(handlebars);
  strings.register(handlebars);
};
