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
        imp.start.analyst(this);
      });

      lemon.live('click', 'a[data-choose]', function (evt, el) {
        var anEl = 'A' == el.tagName ? el : $(el).parent(),
          choo = lemon.data(anEl, 'choose');
        if (!$(anEl).hasClass('disabled')) {
          $(anEl).addClass('active disabled');
          alert(el.tagName + JSON.stringify(choo));
          lemon.delay(function () {
            $(anEl).removeClass('active disabled');
          }, 10000);
        }
      });
    },

    analyst: function (selector, callback) {
      var iType = null, startVal = $(imp.start.id).val();
      switch (iType = lemon.data(selector, 'start')) {
        case 3:
          imp.views(startVal);
          break;
        default:
          if (!lemon.isBlank(startVal)) {
            var pg = lemon.progress('#start_row');
            $.post('/import/analyst', {
              data: lemon.enc({
                type: iType,
                val: startVal
              })
            }).done(function (resp) {
              if (0 == resp.code) {
                var rdata = lemon.deepDec(resp.result);

              }
              //swagger resource
              else if (3 == resp.code) {
                var swaggerResource = lemon.deepDec(resp.result), chooId = '#start_choose';
                $(chooId).empty();
                lemon.tmpls('#imp_choose_tmpl', {
                  items: swaggerResource
                }, chooId);
              } else {
                lemon.msg(resp.msg, {
                  containerId: '#start_msg'
                });
              }

              pg.end();
              lemon.isFunc(callback) && callback();
            });
          }
          break;
      }
    }
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
