/**
 *
 */
var mirror = require('../js/codemirror');

function leave() {

}

var imp = {
  id: '#import_container',

  start: {
    intl: function () {
      lemon.tmpls('#imp_start_tmpl', {}, imp.id);
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
