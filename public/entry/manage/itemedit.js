/**
 *
 */
var mirror = require('../../js/codemirror');

var editor = {

  getVal: function (selector) {
    return $.parseJSON(lemon.dec($(selector).val()));
  },

  intlcm: function () {
    var cm = mirror('#item-editor'),
      schema = editor.getVal('#item-schema'), val = editor.getVal('#item-value');
    cm.setJsonVal(val);
    $('#output').val(lemon.fmtjson(schema));
    mirror.showJson('#output');
    return cm;
  },

  initialize: function() {
    var hasResource = $('#res-tree').length, cm = editor.intlcm(), tree = '#res-tree';;
    if (hasResource) {
      lemon.sourcetree(tree, $(tree).attr('action'), {
        showopt: $(tree).attr('showopt')
      });
    }

    var submitEl = '#item-submit', dataset = $(submitEl).data();
    $(submitEl).click(function () {
      msg.clear();
      lemon.disable(this);
      var method = dataset.method.toLowerCase(), action = dataset.action, params = {};
      params.item = lemon.enc(cm.target.getValue());
      if (hasResource) {
        params.resource = lemon.chkboxval('resource');
      }

      $('div[id^=item-sel-]').each(function() {
        var ds = $(this).data();
        params[ds.checkname] = lemon.chkboxval(ds.checkname);
      });

      ($[method] || lemon[method])(action, params).done(function(resp) {
        if (0 == resp.code) {
          msg.succ('<Strong>' + resp.msg + '</Strong>', '#item-card');

          if (resp.result.resourceUpdate) {
            lemon.sourcetree(tree, $(tree).attr('action'), {
              showopt: resp.result.res_tab || 1
            });
          }
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
