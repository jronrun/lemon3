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
    mapi.requ = mapi.mirror('#request', '#requ-card');

    $('#btn-tgl-form').click(function () {
      if (lemon.buttonTgl(this)) {
        lemon.tabShow('#tab-tri-form');
      } else {
        lemon.tabShow('#tab-tri-mirror');
      }
    });
  },
  intlResp: function () {
    mapi.resp = mapi.mirror('#response', '#resp-card');
  },
  initialize: function() {
    mapi.intlRequ();
    mapi.intlResp();
  }
};

$(function () { mapi.initialize(); });


