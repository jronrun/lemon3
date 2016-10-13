/**
 *
 */
require('bootstrap/js/dist/tooltip');
require('imports?require=>false,define=>false,module=>false!summernote');
var mirror = require('../js/codemirror');

var helper = function () {

};

var summer = function (elId, options) {
  options = lemon.extend({
    onInit: function () {

    }
  }, options || {});

  $(elId).summernote(options);
};

lemon.extend(summer, {
  mirror: mirror
});

module.exports = summer;
