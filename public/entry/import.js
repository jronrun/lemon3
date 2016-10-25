/**
 *
 */
var mirror = require('../js/codemirror');

function leave() {

}

var imp = {
  id: '#import_container',

  views: function (text, hiddenCall, noneWrapJSON, domReadyCall) {
    var jsonOptions = false;
    if (!noneWrapJSON) {
      if (mirror.isJson(text, true)) {
        text = lemon.fmtjson(text);
        jsonOptions = {
          mirror: mirror,
          isDecode: true
        };
      }
    }

    //lemon.preview(text, callback, jsonOptions, domReadyCallbackIfUrl, modalOptions, modalEvents)
    return lemon.preview(text, function () {
    }, jsonOptions, domReadyCall, false, {
      hidden: function () {
        lemon.isFunc(hiddenCall) && hiddenCall();
      }
    });
  },

  start: {
    id: '#start_source',
    intl: function () {
      lemon.tmpls('#imp_start_tmpl', {}, imp.id);

      $('button[data-start]').click(function () {
        switch (lemon.data(this, 'start')) {
          case 1:
            alert('swagger');
            break;
          case 2:
            alert('curl');
            break;
          case 3:
            imp.views($(imp.start.id).val());
            break;
        }
      });
    },
  },

  swagger: {

  },

  curl: {

  },

  initialize: function () {
    if (lemon.isMediumUpView()) {
      lemon.console();
    }

    imp.start.intl();

    lemon.subMsg(function (data) {
      // lemon.info(data, 'Import received msg');
      if (data && data.event) {
        var evtData = data.data;
        switch (data.event) {

        }
      }
    });

    lemon.unload(function () {
      if (lemon.isRootWin()) {
        leave();
      }
    });

  }
};

$(function () { imp.initialize(); });
