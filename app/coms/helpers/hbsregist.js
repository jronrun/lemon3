'use strict';

var layouts = require('handlebars-layouts');

module.exports.register = function (handlebars, options) {
  options = options || {};

  handlebars.registerHelper(layouts(handlebars));
};
