/**
 *
 */
var mirror = require('../../js/codemirror');

var editor = {

  initialize: function() {
    var cm = mirror('#item-editor');
    $('#output').val(lemon.fmtjson(lemon.decode($('#item-schema').val())));
    mirror.showJson('#output');
  }
};

$(function () {
  register(function () {
    editor.initialize();
  });
});
