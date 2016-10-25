/**
 *
 */
var mirror = require('../js/codemirror');

function leave() {

}

var imp = {

  initialize: function () {
    if (lemon.isMediumUpView()) {
      lemon.console();
    }

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
