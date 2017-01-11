/**
 *
 */
var mirror = require('../js/codemirror'),
  marked = require('marked')
  ;

marked.setOptions({
  renderer: new marked.Renderer(),
  gfm: true,
  tables: true,
  breaks: false,
  pedantic: false,
  sanitize: false,
  smartLists: true,
  smartypants: false,
  highlight: function (code, lang, callback) {
    mirror.highlights({
      input: code,
      mode: lang || 'text',
      resultHandle: function (ret) {
        callback(null, ret);
      }
    });
  }
});

var show = {
  taId: '#show_ta',
  cardId: '#show-card',
  instance: null,
  content: null,

  view: {
    intl: function () {
      $(show.cardId).css({
        height: $(window).height(),
        width: $(window).width()
      });

      show.instance = mirror.shows(show.taId);
      show.instance.setSize(null, $(show.cardId).height());

      lemon.live('click', show.cardId + ' button[data-show]', function (evt) {
        var el = evt.originalEvent.target.parentNode, showT = lemon.data(el, 'show'),
          btnSel = 'button[data-show="' + lemon.enc(showT) + '"]';
        if (show.tool.btnTgl(btnSel)) {
          switch (showT) {
            case 1:
              try {
                show.instance.val(mirror.dl.format.summary(show.instance.json()));
              } catch (e) {
                show.tool.btnTgl(btnSel, 3);
              }
              break;
            case 2:
              try {
                show.instance.val(mirror.dl.format.table(show.instance.json(), {
                  minwidth: 200,
                  maxwidth: 500
                }));
              } catch (e) {
                show.tool.btnTgl(btnSel, 3);
              }
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

  load: function (evtData) {
    var langN = evtData.lang.name;
    if (['HTML'].indexOf(langN) != -1) {
      return lemon.previewInSelfWin(evtData.content);
    }

    try {
      if (['Markdown'].indexOf(langN) != -1) {
        marked(evtData.content, function (err, content) {
          $(show.cardId).html(content);
        });
        // return lemon.previewInSelfWin(markedH);
      }
    } catch (e) {
      lemon.warn('marked err: ' + e.message);
    }

    show.loadMirror(evtData);
  },

  loadMirror: function (evtData) {
    show.instance.mode(evtData.lang.name || 'text', evtData.lang.mime || undefined);
    show.instance.val(evtData.content);
    show.instance.theme(evtData.th);
    show.tool.intl();
    show.content = evtData.content;
  },

  tool: {
    intl: function () {
      if (!show.instance.isJson(true)) {
        return;
      }

      var aJson = show.instance.json(), isArr = lemon.isArray(aJson);
      $(show.cardId + ' button[data-show]').each(function () {
        var showT = lemon.data(this, 'show');
        switch (showT) {
          case 1: if (isArr) { try { mirror.dl.format.summary(aJson); $(this).show(); } catch (e) {/**/} } break;
          case 2: if (isArr) { try { mirror.dl.format.table(aJson); $(this).show(); } catch (e) {/**/} } break;
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
      // lemon.info(data, 'Show received msg');
      if (data && data.event) {
        var evtData = data.data;
        switch (data.event) {
          case 'FILL_CONTENT':
            show.load(evtData);
            break;
        }
      }
    });
  }
};

$(function () { show.initialize(); });

