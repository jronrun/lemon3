/**
 *
 */
var mirror = require('../../js/codemirror');

var editor = {
  ctx: {},
  getVal: function (selector) {
    return $.parseJSON(lemon.dec($(selector).val()));
  },

  intlcm: function () {
    var cm = mirror('#item-editor'), val = editor.getVal('#item-value');
    cm.json(val);
    return cm;
  },

  intlschema: function() {
    var schema = editor.getVal('#item-schema');
    $('#output').val(lemon.fmtjson(schema));
    mirror.showJson('#output');
  },

  asCodemirror: function() {
    $('#item-card textarea[codemirror="1"]').each(function () {
      var id = $(this).attr('id'), name = $(this).attr('name');
      editor.ctx[name] = editor.ctx[name] || mirror('#' + id);
    });
  },

  initialize: function() {
    var submitEl = '#item-submit', dataset = $(submitEl).data(), cm;
    switch (dataset.form) {
      //html form
      case 1:
        lemon.fillParam('#item-card', editor.getVal('#item-value'));
        break;
      //codemirror
      case 2:
        editor.intlschema();
        cm = editor.intlcm();
        break;
      default:
        lemon.warn('Unrecognized form type: ' + dataset.form);
        return;
    }

    var hasResource = $('#res-tree').length, tree = '#res-tree';;
    if (hasResource) {
      lemon.sourcetree(tree, $(tree).attr('action'), {
        showopt: $(tree).attr('showopt')
      });
    }

    editor.asCodemirror();

    $(submitEl).click(function () {
      lemon.disable(this);
      msg.clear();
      var method = dataset.method.toLowerCase(), action = dataset.action, params = {};
      if (1 == dataset.form) {
        var reqData = lemon.getParam('#item-card');
        delete reqData.resource;
        params.item = lemon.enc(JSON.stringify(reqData));
      } else if (2 == dataset.form) {
        params.item = lemon.enc(cm.target.getValue());
      }
      if (hasResource && 1 == $(tree).attr('showopt')) {
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
