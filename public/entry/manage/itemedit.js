/**
 *
 */
var mirror = require('../../js/codemirror');

var editor = {

  getSchema: function (selector) {
    return $.parseJSON(lemon.dec($(selector).val()));
  },

  getDefault: function(schema) {
    var def = {};
    lemon.each(schema, function (v, k) {
      def[k] = '';
    });
    return def;
  },

  intlcm: function () {
    var cm = mirror('#item-editor'), schema = editor.getSchema('#item-schema');
    cm.setJsonVal(editor.getDefault(schema));
    $('#output').val(lemon.fmtjson(schema));
    mirror.showJson('#output');
    return cm;
  },

  initialize: function() {
    var hasResource = $('#res-tree').length, cm = editor.intlcm();

    if (hasResource) {
      lemon.sourcetree('#res-tree');
    }

    var submitEl = '#item-submit';
    $(submitEl).click(function () {
      msg.clear();
      lemon.disable(this);
      var method = $(this).attr('m').toLowerCase(),
        action = $(this).attr('act'), listAction = $('#item-back').attr('href'), params = {};
      params.item = lemon.enc(cm.target.getValue());
      if (hasResource) {
        params.resource = lemon.chkboxval('resource');
      }

      $[method](action, params).done(function(resp) {
        if (0 == resp.code) {
          msg.succ('<Strong>' + resp.msg + '</Strong>', '#item-card');
        } else {
          msg.warn(resp.msg, '#item-card');
        }
        lemon.enable(submitEl);
      }).fail(function(jqXHR, textStatus, errorThrown){
          lemon.error(jqXHR);
          lemon.error(textStatus, 'request status');
          lemon.error(errorThrown);
          msg.error('Request Failed', '#item-card');
          lemon.enable(submitEl);
        }
      );
    });
  }
};

$(function () {
  register(function () {
    editor.initialize();
  });
});
