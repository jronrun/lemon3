/**
 *
 */
var mirror = require('../js/codemirror');

mapi = {
  requ: null,
  resp: null,
  mirror: function(elId, sizeElId, options) {
    var instance = mirror(elId, options);
    instance.setSize($(sizeElId).width(), $(sizeElId).height() - 46);
    return instance;
  },
  intlRequ: function() {
    var requCardEl = '#requ-card', requTool = '#requ-tool';
    mapi.requ = mapi.mirror('#request', requCardEl);

    if (lemon.isView(['md','lg'])) {
      var fromH = $(requCardEl).height() - 46;
      $('#tab-form').css({
        width: $(requCardEl).width(),
        height: fromH,
        'max-height': fromH,
        'overflow-y': 'scroll'
      });
    }

    $('#btn-tgl-form').click(function () {
      if (lemon.buttonTgl(this)) {

        if (mapi.requ.isJson()) {
          lemon.progress(requTool);
          $.post('/general/form', {data: lemon.enc(mapi.requ.json())}).done(function (resp) {
            $('#tab-form').html(resp);
            lemon.tabShow('#tab-tri-form');
            lemon.progressEnd(requTool);
          });
        } else {
          lemon.buttonTgl(this);
          alert('not json');
        }
      } else {
        lemon.progress(requTool);
        var aData = lemon.getParam('#tab-form');
        $.post('/general/convert', {data: lemon.enc(aData)}).done(function (resp) {
          if (0 == resp.code) {
            mapi.requ.json(lemon.dec(resp.result.data));
            lemon.tabShow('#tab-tri-mirror');
          } else {
            alert(resp.msg);
          }
          lemon.progressEnd(requTool);
        });

      }
    });
  },
  intlResp: function () {
    var respCardEl = '#resp-card', respTool = '#resp-tool';
    mapi.resp = mapi.mirror('#response', respCardEl);
  },
  initialize: function() {
    mapi.intlRequ();
    mapi.intlResp();
  }
};

$(function () { mapi.initialize(); });


