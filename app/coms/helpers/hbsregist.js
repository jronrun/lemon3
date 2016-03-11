'use strict';

var layouts = require('handlebars-layouts'),
  compare = require('./comparisons');

module.exports.register = function (handlebars, options) {
  options = options || {};

  handlebars.registerHelper(layouts(handlebars));
  compare.register(handlebars);
};
