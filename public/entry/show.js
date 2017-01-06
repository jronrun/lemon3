/**
 *
 */
var mirror = require('../js/codemirror');

var show = {
  taId: '#show_ta',
  instance: null,

  initialize: function() {
    if (lemon.isMediumUpView()) {
      lemon.console();
    }

    show.instance = mirror.shows(show.taId);

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

//TODO rem
global.show=show;
global.$=$;


