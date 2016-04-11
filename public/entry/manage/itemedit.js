/**
 *
 */
var mirror = require('../../js/codemirror');

var editor = {

  getSchema: function (selector) {
    return $.parseJSON(lemon.decode($(selector).val()));
  },

  getDefault: function(schema) {
    var def = {};
    lemon.each(schema, function (v, k) {
      def[k] = '';
    });
    return def;
  },

  initialize: function() {
    var cm = mirror('#item-editor'), schema = editor.getSchema('#item-schema');
    cm.setJsonVal(editor.getDefault(schema));
    $('#output').val(lemon.fmtjson(schema));
    mirror.showJson('#output');

    if ($('#res-tree').length) {
      lemon.sourcetree('#res-tree');
    }
  }
};

$(function () {
  register(function () {
    editor.initialize();
  });
});
