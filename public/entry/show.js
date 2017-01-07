/**
 *
 */
var mirror = require('../js/codemirror');

var show = {
  taId: '#show_ta',
  cardId: '#show-card',
  instance: null,
  content: null,

  view: {
    intl: function () {
      $(show.cardId).css({
        height: $(window).height()
      });

      show.instance = mirror.shows(show.taId);
      show.instance.setSize(null, $(show.cardId).height());

      lemon.live('click', show.cardId + ' button[data-show]', function (evt) {
        var el = evt.originalEvent.target.parentNode, showT = lemon.data(el, 'show'),
          btnSel = 'button[data-show="' + lemon.enc(showT) + '"]';
        if (show.tool.btnTgl(btnSel)) {
          switch (showT) {
            case 1: show.instance.val(mirror.dl.format.summary(show.instance.json())); break;
            case 2:
              show.instance.val(mirror.dl.format.table(show.instance.json(), {
                minwidth: 200,
                maxwidth: 500
              }));
              break;
            case 3:
              show.instance.queriesTgl(true, function () {
                show.tool.btnTgl(btnSel, 3);
              });
              break;
          }
        } else {
          switch (showT) {
            case 1: case 2: show.instance.val(show.content); break;
          }
        }
        $(el).blur();
      });
    }
  },

  tool: {
    intl: function () {
      if (!show.instance.isJson()) {
        return;
      }

      var isArr = lemon.isArray(show.instance.json());
      $(show.cardId + ' button[data-show]').each(function () {
        var showT = lemon.data(this, 'show');
        switch (showT) {
          case 1:
          case 2: if (isArr) { $(this).show(); } break;
          //case 3: $(this).show(); break;
        }
      });
    },

    btnTgl: function (selector, opt) {
      return lemon.clazzTgl(selector + ' em', 'text-info', opt, 'text-silver');
    },
    isBtnActive: function (selector) {
      return lemon.isClazzActive(selector + ' em', 'text-info');
    }
  },

  initialize: function() {
    if (lemon.isMediumUpView()) {
      lemon.console();
    }

    show.view.intl();
    lemon.subMsg(function (data) {
      //lemon.info(data, 'Show received msg');
      if (data && data.event) {
        var evtData = data.data;
        switch (data.event) {
          case 'FILL_CONTENT':
            show.instance.mode(evtData.lang.name || 'text', evtData.lang.mime || undefined);
            show.instance.val(evtData.content);
            show.instance.theme(evtData.th);
            show.tool.intl();
            show.content = evtData.content;
            break;
        }
      }
    });
  }
};

$(function () { show.initialize(); });

