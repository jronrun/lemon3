/**
 *
 */
var cardId = '#show-card',
  mirror = require('../js/codemirror'),
  marked = require('../js/markdown')({
    mirror: mirror,
    output: cardId
  }),
  beautify = require('js-beautify'),
  beautifyCss = beautify.css,
  beautifyHtml = beautify.html
  ;

/*
 marked = require('marked')

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
    $(cardId).html(content);
 });
 */

var show = {
  taId: '#show_ta',
  instance: null,
  lframe: null,
  content: null,

  view: {
    intl: function () {
      if (!$(show.taId).length) {
        $(cardId).append('<textarea class="form-control" rows="1" style="border: none;display: none;" id="show_ta"></textarea>');
      }

      $(cardId).css({
        height: $(window).height(),
        width: $(window).width()
      });

      show.instance = mirror.shows(show.taId);
      show.instance.setSize(null, $(cardId).height());
      show.instance.chgStyle({
        padding: '1.2rem'
      });
      show.instance.prependHtml(lemon.tmpl($('#statics_tool_tmpl').html(), {}));

      lemon.live('click', cardId + ' button[data-show]', function (evt) {
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
    var txt = evtData.content, cleanIfr = function () {
      if (show.lframe) {
        show.lframe.destroy();
        show.lframe = null;
      }
    },  makePreview = function (targetTxt) {
      return lemon.previewInSelfWin(targetTxt, function (lview, lframe) {
        lframe.lview = lview;
        show.lframe = lframe;
      }, false, false, {
        contentClose: false
      });
    }, showInIfr = function (targetTxt, isHref) {
      if (!show.lframe) {
        return makePreview(targetTxt);
      }

      if (isHref) {
        return show.lframe.lview.openUrl(targetTxt);
      }

      if (show.lframe.lview.srcIsUrl) {
        cleanIfr();
        return makePreview(targetTxt);
      }

      show.lframe.lview.write((targetTxt || '').replace(/\\\//g, '/'));
    };

    var langN = evtData.lang.name;
    if (lemon.isUrl(txt)) {
      return showInIfr(txt, true);
    }

    if (['HTML'].indexOf(langN) != -1) {
      return showInIfr(txt);
    }

    cleanIfr();

    $(cardId).css({
      'margin-top': '-1rem',
      padding: '0rem'
    });

    try {
      if (['Markdown'].indexOf(langN) != -1) {
        $(cardId).css({
          'margin-top': '0rem',
          padding: '2rem'
        });

        return marked.render(txt, {}, evtData.th);
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
    if (!$(show.taId).length) {
      show.view.intl();
    }

    show.instance.mode(evtData.lang.name || 'text', evtData.lang.mime || undefined);
    show.instance.val(evtData.content);
    show.instance.theme(evtData.th);
    show.tool.intl();
    show.content = evtData.content;
  },

  tool: {
    intl: function () {
      var bsel = cardId + ' button[data-show]';
      if (!show.instance.isJson(true)) {
        return $(bsel).hide();
      }

      var aJson = show.instance.json(), isArr = lemon.isArray(aJson);
      if (!isArr) {
        return $(bsel).hide();
      }

      $(bsel).each(function () {
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
