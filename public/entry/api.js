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
      if (!mapi.requ.isJson()) {
        lemon.msg('The Request Data is not a Valid JSON or JSON5.');
        return;
      }

      //-> form
      if (lemon.buttonTgl(this)) {
        lemon.progress(requTool);
        $.post('/general/form', {data: lemon.enc(mapi.requ.json())}).done(function (resp) {
          $('#tab-form').html(resp);
          lemon.tabShow('#tab-tri-form');
          lemon.progressEnd(requTool);
        });

      }
      //-> json
      else {
        lemon.progress(requTool);
        var aData = lemon.getParam('#tab-form');
        $.post('/general/convert', {
          data: lemon.enc(aData),
          original: lemon.enc(mapi.requ.val())
        }).done(function (resp) {
          if (0 == resp.code) {
            mapi.requ.json(lemon.dec(resp.result.data));
            lemon.tabShow('#tab-tri-mirror');
          } else {
            lemon.msg(resp.msg);
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
  intlServs: function() {
    //$.post('/api/servers', function (data) {
    //  console.log(JSON.stringify(data));
    //});

    $('#env_dd a').click(function(e) {
      e.stopPropagation();
    }).dblclick(function(e) {
      $('#env_dd').click();
    })

  },
  initialize: function() {
    if (lemon.isView('xs', 'sm')) {
      $('head').append('<style>li.nav-item { margin:0 0 5px 0; }</style>');
    }

    mapi.intlRequ();
    mapi.intlResp();
    mapi.intlServs();
  }
};

$(function () { mapi.initialize(); });


