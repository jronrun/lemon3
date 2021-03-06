'use strict';

var layouts = require('handlebars-layouts'),
  strings = require('./strings'),
  is = require('./is'),
  comparisons = require('./comparisons');

module.exports.register = function (handlebars, options) {
  options = options || {};

  handlebars.registerHelper(layouts(handlebars));
  comparisons.register(handlebars);
  strings.register(handlebars);
  is.register(handlebars);
};

/*
 Handlebars each
 For arrays:

 {{#each myArray}}
 Index: {{@index}} Value = {{this}}
 {{/each}}
 For objects:

 {{#each myObject}}
 Key: {{@key}} Value = {{this}}
 {{/each}}
 */
