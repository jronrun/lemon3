/**
 *
 */
var mirror = require('../js/codemirror');

var show = {
  taId: '#show_ta',
  cardId: '#show-card',
  instance: null,

  initialize: function() {
    if (lemon.isMediumUpView()) {
      lemon.console();
    }

    $(show.cardId).css({
      height: $(window).height()
    });

    show.instance = mirror.shows(show.taId);
    show.instance.setSize(null, $(show.cardId).height());

    lemon.subMsg(function (data) {
      //lemon.info(data, 'Show received msg');
      if (data && data.event) {
        var evtData = data.data;
        switch (data.event) {
          case 'FILL_CONTENT':
            show.instance.mode(evtData.lang.name || 'text', evtData.lang.mime || undefined);
            show.instance.val(evtData.content);
            show.instance.theme(evtData.th);
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


