/**
 *
 */
var mirror = require('../js/codemirror'),
  marked = require('marked'),
  beautify = require('js-beautify'),
  beautifyCss = beautify.css,
  beautifyHtml = beautify.html
  ;

marked.setOptions({
  renderer: new marked.Renderer(),
  gfm: true,
  tables: true,
  breaks: false,
  pedantic: false,
  sanitize: false,
  smartLists: true,
  smartypants: false
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
      show.instance.chgStyle({
        padding: '1.2rem'
      });
      show.instance.prependHtml(lemon.tmpl($('#statics_tool_tmpl').html(), {}));

      lemon.live('click', show.cardId + ' button[data-show]', function (evt) {
        var el = evt.originalEvent.target.parentNode, showT = lemon.data(el, 'show'),
          btnSel = 'button[data-show="' + lemon.enc(showT) + '"]';
        if (show.tool.btnTgl(btnSel)) {
          switch (showT) {
            case 1:
              try {
                show.instance.val(mirror.dl.format.summary(show.instance.json()));
                show.instance.attrs('lineWrapping', false);
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
                show.instance.attrs('lineWrapping', false);
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
            case 1:
            case 2:
              show.instance.val(show.content);
              show.instance.attrs('lineWrapping', true);
              break;
          }
        }
        $(el).blur();
      });
    }
  },

  load: function (evtData) {
    var txt = evtData.content;
    if (lemon.isUrl(txt)) {
      return lemon.previewInSelfWin(txt);
    }

    var langN = evtData.lang.name;
    if (['HTML'].indexOf(langN) != -1) {
      return lemon.previewInSelfWin(txt);
    }

    try {
      if (['Markdown'].indexOf(langN) != -1) {
        marked.setOptions({
          highlight: function (code, lang, callback) {
            mirror.highlights({
              input: code,
              mode: lang || 'text',
              theme: evtData.th,
              resultHandle: function (ret) {
                callback(null, ret);
              }
            });
          }
        });

        return marked(txt, function (err, content) {
          $(show.cardId).html(content);
        });
        // return lemon.previewInSelfWin(markedH);
      }
    } catch (e) {
      lemon.warn('marked err: ' + e.message);
    }

    try {
      var lang = mirror.modeInfo(langN) || {}, matched = false;
      lemon.each(show.beautifies, function (aRender) {
        if (matched) {
          return false;
        }

        if (aRender.key.indexOf(lang[aRender.type || 'mode']) != -1) {
          evtData.content = aRender.beautify(txt);
          matched = true;
        }
      });
    } catch (e) {
      lemon.warn('beautify err: ' + e.message);
    }

    show.loadMirror(evtData);
  },

  beautifies: [
    {
      key: ['sql'],
      beautify: lemon.fmtsql
    },
    {
      key: ['xml'],
      beautify: lemon.fmtxml
    },
    {
      key: ['css'],
      beautify: beautifyCss
    },
    {
      key: ['htmlembedded', 'htmlmixed'],
      beautify: beautifyHtml
    },

    {
      type: 'name',
      key: ['JSON', 'JSON-LD'],
      beautify: lemon.fmtjson
    },
    {
      type: 'name',
      key: ['JavaScript', 'Embedded Javascript', 'TypeScript'],
      beautify: beautify
    }
  ],

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
