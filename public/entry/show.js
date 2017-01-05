/**
 *
 */
var mirror = require('../js/codemirror');

var show = {
  id: 'show_ta',
  initialize: function() {
    if (lemon.isMediumUpView()) {
      lemon.console();
    }

    lemon.subMsg(function (data) {
      //lemon.info(data, 'Show received msg');
      if (data && data.event) {
        var evtData = data.data;
        switch (data.event) {
          case 'NOTE_CLOSE':
            break;
        }
      }
    });
  }
};

$(function () { show.initialize(); });


