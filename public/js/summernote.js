/**
 *
 */
require('bootstrap/js/dist/tooltip');
require('imports?require=>false,define=>false,module=>false!summernote');
var mirror = require('../js/codemirror');

var helper = function () {

};

var summer = function (options) {
  options = lemon.extend({
    elId: ''
  }, options || {});

  $(options.elId).summernote({
    onInit: function () {

    }
  });
};

lemon.extend(summer, {
  mirror: mirror
});

module.exports = summer;
