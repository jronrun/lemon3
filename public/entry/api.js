/**
 *
 */
var mirror = require('../js/codemirror');

var mapi = {
  requ: null,
  resp: null,

  mirror: function(elId, sizeElId) {
    var instance = mirror(elId);
    instance.setSize($(sizeElId).width(), $(sizeElId).height() - 46);
    return instance;
  },
  intlRequ: function() {
    var requCardEl = '#requ-card', requTool = '#requ-tool';
    mapi.requ = mapi.mirror('#request', requCardEl);
    $('#tab-form').css({width: $(requCardEl).width()});

    $('#btn-tgl-form').click(function () {
      if (lemon.buttonTgl(this)) {
        lemon.progress(requTool);
        lemon.tabShow('#tab-tri-form');
        lemon.progressEnd(requTool);
      } else {
        lemon.tabShow('#tab-tri-mirror');
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


