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
    var addition = editor.getVal('#item-addition') || {};
    $('#item-card').find('textarea[codemirror="1"]').each(function () {
      var id = '#' + $(this).attr('id'), name = $(this).attr('name');
      editor.ctx[name] = mirror(id, false, {
        fullscreen: function(isFullscreen) {
          $('aside, header').toggle(!isFullscreen);
        }
      });

      var tabId = '#' + $(id).parentsUntil('.tab-content', '[id^="item-sel-"]').attr('id');
      lemon.tabEvent(tabId, {
        shown: function (current, previous) {
          editor.ctx[name].refreshDelay();
        }
      });

      var theVal = addition[name];
      if (theVal) {
        editor.ctx[name].val(lemon.fmtjson(lemon.dec(theVal)));
      }
    });
  },

  listChooseBtn: function() {
    $('#item-card').find('button[listchoose="1"]').click(function () {
      var ds = $(this).data();
      lemon.pjaxBeforeSend(ds.to, function (evt, xhr) {
        ds.params = editor.getParams();
        xhr.setRequestHeader('listchoose', lemon.enc(ds));
      }, 1);
      lemon.pjax(ds.to);
    });
  },

  listChooseBack: function(dataset) {
    var lcoption = '#listchooseback-option';
    if (1 == dataset.lcback && $(lcoption).length) {
      var chooseback = $.parseJSON(lemon.dec($(lcoption).data('body')));
      var backdata = lemon.store(chooseback.base) || null;
      if (null != backdata) {
        var original = $.parseJSON(lemon.dec(backdata.choose.params.item));
        original[backdata.choose.field] = (backdata.ids || []).join(',');
        lemon.chkboxReset('#item-card');
        lemon.fillParam('#item-card', original);
        lemon.store(chooseback.base, null);
      }
    }
  },

  getParams: function() {
    var params = {}, tree = '#res-tree',
      hasResource = $(tree).length, dataset = $('#item-submit').data();

    if (1 == dataset.form) {
      var reqData = lemon.getParam('#item-card', 'textarea');
      delete reqData.resource;
      params.item = lemon.enc(JSON.stringify(reqData));
    } else if (2 == dataset.form) {
      params.item = lemon.enc(cm.target.getValue());
    }

    if (hasResource && 1 == $(tree).attr('showopt')) {
      params.resource = lemon.chkboxval('resource');
    }

    var isValidJSON5 = true;
    $('#item-card').find('textarea[codemirror="1"]').each(function () {
      var required = $(this).attr('required'), name = $(this).attr('name');
      var theCM = editor.ctx[name];
      var val = theCM.val();
      if (theCM.isJson()) {
        params[name] = lemon.enc(val);
      } else {
        if ('required' == required || '' != val) {
          isValidJSON5 = false;
          msg.warn(name + ' is not valid JSON.', '#item-card');
        }
      }
    });

    if (!isValidJSON5) {
      return -1;
    }

    $('div[id^=item-sel-]').each(function() {
      var ds = $(this).data();
      if (ds.checkname.length) {
        params[ds.checkname] = lemon.chkboxval(ds.checkname);
      }
    });

    return params;
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

    var tree = '#res-tree', hasResource = $(tree).length;
    if (hasResource) {
      lemon.sourcetree(tree, $(tree).attr('action'), {
        showopt: $(tree).attr('showopt')
      });
    }

    editor.asCodemirror();
    editor.listChooseBtn();
    editor.listChooseBack(dataset);

    if (1 != dataset.buttons) {
      $(submitEl).remove();
      return;
    }

    $(submitEl).click(function () {
      if (lemon.isDisable(this)) {
        return;
      }
      lemon.disable(this);
      msg.clear();

      var method = dataset.method.toLowerCase(),
        action = dataset.action,
        params = editor.getParams();

      if (-1 == params) {
        lemon.enable(submitEl);
        return;
      }

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
    lemon.tabEventListen();
  });
});
