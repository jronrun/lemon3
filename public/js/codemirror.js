/**
 *
 */
require('codemirror/lib/codemirror.css');

global.CodeMirror = require('codemirror/lib/codemirror');

var json5s = require('./json5s'),
  X2JSFactory = require('./lib/xml2json'),
  dl = require('./datalib')
  ;

var X2JS = new X2JSFactory();

require('./lib/vkBeautify');
global._ = {};  //for json5s
_.each = lemon.each;

require('codemirror/addon/comment/comment');
require('codemirror/addon/comment/continuecomment');
require('codemirror/addon/dialog/dialog.css');
require('codemirror/addon/dialog/dialog');

require('codemirror/addon/display/autorefresh');
require('codemirror/addon/display/fullscreen.css');
require('codemirror/addon/display/fullscreen');
require('codemirror/addon/display/panel');
require('codemirror/addon/display/placeholder');

require('codemirror/addon/edit/closebrackets');
require('codemirror/addon/edit/closetag');
require('codemirror/addon/edit/continuelist');
require('codemirror/addon/edit/matchbrackets');
require('codemirror/addon/edit/matchtags');

require('codemirror/addon/fold/brace-fold');
require('codemirror/addon/fold/comment-fold');
require('codemirror/addon/fold/foldcode');
require('codemirror/addon/fold/foldgutter.css');
require('codemirror/addon/fold/foldgutter');
require('codemirror/addon/fold/indent-fold');
require('codemirror/addon/fold/markdown-fold');
require('codemirror/addon/fold/xml-fold');

require('codemirror/addon/hint/anyword-hint');
require('codemirror/addon/hint/css-hint');
require('codemirror/addon/hint/html-hint');
require('codemirror/addon/hint/javascript-hint');
require('codemirror/addon/hint/show-hint.css');
require('codemirror/addon/hint/show-hint');
require('codemirror/addon/hint/sql-hint');
require('codemirror/addon/hint/xml-hint');

require('codemirror/addon/runmode/runmode');
require('codemirror/addon/scroll/annotatescrollbar');

require('codemirror/addon/search/jump-to-line');
require('codemirror/addon/search/match-highlighter');
require('codemirror/addon/search/matchesonscrollbar.css');
require('codemirror/addon/search/matchesonscrollbar');
require('codemirror/addon/search/search');
require('codemirror/addon/search/searchcursor');

require('codemirror/addon/selection/active-line');
require('codemirror/addon/selection/mark-selection');
require('codemirror/addon/selection/selection-pointer');

require('codemirror/addon/wrap/hardwrap');

require('codemirror/mode/meta');
require('codemirror/mode/javascript/javascript');

lemon.fmtjson = function(target) {
  if (!lemon.isString(target)) {
    target = json5s.stringify(target);
  }
  return json5s.format(target);
};
lemon.fmtxml = function (target, isMin) {
  if (!lemon.isString(target)) {
    return target;
  }

  return vkbeautify[isMin ? 'xmlmin' : 'xml'](target);
};

var languages = {}, modes = {}, loadedTheme = ['default', 'lemon'], themes = [
  'default','lemon','3024-day','3024-night','abcdef','ambiance','base16-dark','base16-light','bespin','blackboard','cobalt',
  'colorforth','dracula','eclipse','elegant','erlang-dark','hopscotch','icecoder','isotope','lesser-dark','liquibyte',
  'material','mbo','mdn-like','midnight','monokai','neat','neo','night','paraiso-dark','paraiso-light','pastel-on-dark',
  'railscasts','rubyblue','seti','solarized,dark','solarized,light','the-matrix','tomorrow-night-bright','tomorrow-night-eighties',
  'ttcn','twilight','vibrant-ink','xq-dark','xq-light','yeti','zenburn'
  ];

function initializeLangs() {
  //["name", "mime", "mode"], Optional property: ["ext", "mimes", "file", "alias"]
  var langs = [];
  lemon.each(CodeMirror.modeInfo || [], function(lang, idx) {
    lang.id = lemon.uniqueId();
    languages[lang.name] = lang;
    modes[lang.mode] = lang;
    langs.push(lang);
  });
  return CodeMirror.modeInfo = langs;
}

initializeLangs();

function langInfo(lang) {
  if (lemon.isBlank(lang)) {
    return null;
  }

  var m, info = null, lang = String(lang);
  info = languages[lang];
  if (!lemon.isBlank(info)) {
    return info;
  }

  info = modes[lang];
  if (!lemon.isBlank(info)) {
    return info;
  }

  if (m = /.+\.([^.]+)$/.exec(lang)) {
    info = CodeMirror.findModeByExtension(m[1]);
  } else if (/\//.test(lang)) {
    info = CodeMirror.findModeByMIME(lang);
    info.mime = lang;
  }

  if (!lemon.isBlank(info)) {
    return info;
  }

  info = CodeMirror.findModeByFileName(lang);
  if (!lemon.isBlank(info)) {
    return info;
  }

  info = CodeMirror.findModeByName(lang);
  if (!lemon.isBlank(info)) {
    return info;
  }

  info = CodeMirror.findModeByExtension(lang);
  if (!lemon.isBlank(info)) {
    return info;
  }

  return null;
}

function loadTheme(th) {
  th = lemon.startWith(th, 'solarized') ? 'solarized' : th;
  if (themes.indexOf(th) == -1) {
    throw Error('Cound not find theme ' + th);
  }

  if (loadedTheme.indexOf(th) == -1) {
    mirror.css(lemon.format('/theme/{0}.css', th));
    loadedTheme.push(th);
  }

  return th;
}

var customEvts = [ 'fullscreen' ];

function intlJoinsModal(host) {
  var html = [
    '<div class="card" style="border: none">',
    '<div class="card-block">',
    '<div class="row">',
    '<div class="col-xs-12 col-sm-12 col-md-12 col-lg-12 col-xl-12">',
    '<input type="text" id="j_i_s" class="form-control borderinfo" placeholder="Separator default is ,">',
    '</div>',
    '</div>',
    '<h1 class="invisible"></h1>',
    '<div class="row">',
    '<div class="col-lg-6 col-md-6 col-sm-12 col-xs-12">',
    '<input type="text" id="j_i_l" class="form-control borderinfo" placeholder="Left, default is empty">',
    '</div>',
    '<div class="col-lg-6 col-md-6 col-sm-12 col-xs-12">',
    '<input type="text" id="j_i_r" class="form-control borderinfo" placeholder="Right, default is empty">',
    '</div>',
    '</div>',
    '</div>',
    '</div>'
  ].join('\n');

  host.joins.jModal = lemon.modal({
    cache: true,
    body: html
  }, {
    hidden: function() {
      host.joins.cfg = { s: $('#j_i_s').val(), l: $('#j_i_l').val(), r: $('#j_i_r').val()};
    }
  });
}

function intlJsonQueries(host) {
  if (!host.queries.qModal) {
    var doId = '#do_json_qry' + lemon.uniqueId(), mid = '#json_qry_mirror' + lemon.uniqueId(),
      fid = '#json_qry_form' + lemon.uniqueId(),
      body = [
      '<form class="form-inline" id="' + lemon.ltrim(fid, '#') + '">',
      '<h1 class="invisible"></h1>',
      '<textarea class="form-control" rows="3" style="border:none;" id="' + lemon.ltrim(mid, '#') + '"></textarea>',
      '</form>'
    ].join(''), footer = [
      '<a class="btn btn-secondary btn-sm text-info icondh" href="https://github.com/vega/datalib/wiki/API-Reference" ' +
      'title="Datalib API Reference" target="_blank" style="border: none; ">',
        '<em class="fa fa-bar-chart"></em>',
      '</a>',
      '<button type="button" class="btn btn-secondary borderinfo" data-dismiss="modal">Cancel</button>',
      '<button type="button" id="' + lemon.ltrim(doId, '#') + '" class="btn btn-primary icondh" ',
      'data-qry-intl="FAegVGAECCB2CGAbAngZwC6QGSQIoFcBTAJwEtDVJTZIApAZQHkA5SMEYAb2AEh4EUGAFyQARKIA0vAI5FiyEdx49eAXyk8AZqUSEAJqhEBGYKtBhgkSADFyiA5cgBxQpluF7xyAHcAFgHtdCUgAbQBdGzs9GGJieGRHQgBzET14EIAGMIA6Uj1g-2JIYkIEAFtCSHhKfDzU9KzcvQAfWr1HRwISZDomVgBaSABZf1gk-0h6dGRdRyNsyfwAByXC9H1IfyWSeHRCw0gAEmpgw9gTo8IAD1IMVFOk9Yf0U8Qno7fTwmlT2EJTsr+fJHJCIU78YGHQq-aFHWD+F5HVCkABe-yO022pxKSWupz8JHRhw8hDKQ12AGNfI4AEwLABKyWuS0gqEI8GIVIowWSIhAAD11hgOFYAMwLVD4ABGmylACtCBTMGyOVTqElHAAWBZ6BGQeHoXakUas9mc3zqjpWOBINDoRyHNKG4qETSE2AUyoU-CxUqYfSkPZFABuSCIjjZlUBJUgvnQ6CWhhAICSgd80uyFP8ZRAweS8BATqQpClIG8pAA1qQQNAAAoASX6jLdJQ9hGA7GAQA">',
      '<em class="fa fa-search" title="Query"></em> Query',
      '</button>'
    ].join(' ');

    host.queries.qModal = lemon.modal({
      cache: true,
      body: body,
      footer: footer,
      modal: {
        backdrop: 'static',
        keyboard: false
      }
    }, {
      shown: function(evt, el) {
        if (!lemon.isEvented(doId)) {
          host.queries.qMirror = mirror(mid, {
            gutters: [],
            cust: {
              escKey: false,
              ctrl1Key: false
            }
          });
          host.queries.qMirror.val(lemon.data(doId, 'qryIntl'));

          $(doId).click(function () {
            if (host.queries.qMirror.isJson()) {
              var pg = lemon.homeProgress();
              var qrys = host.queries.qMirror.json(),
                qryResult = host.queryJson(qrys.query, 1 === qrys.fileds ? undefined : qrys.fileds, qrys.analyst);
              if (-1 === qryResult) {
                lemon.alert('There is none valid json.'); pg.end();
                return;
              }

              lemon.info(qrys, 'JSON queries');
              lemon.info(qryResult, 'JSON queries result');

              host.queries.qModal.hide();
              showInNote(fmtIfJson(qryResult));
            } else {
              lemon.msg('Not a valid Query', {
                containerId: fid
              });
            }
          });
          lemon.setEvented(doId);
        }
      }
    });
  }
}

function fmtIfJson(data) {
  try {
    data = lemon.fmtjson(data);
  } catch (e) {/**/}
  return data;
}

function showInNote(aContent, pg) {
  pg = pg || lemon.homeProgress();
  return lemon.preview(lemon.fullUrl('/note'), false, false, function (view, previewM) {
    view.tellEvent('SHOW_JSON_QRY_IN_NOTE', {
      th: 'lemon',
      note: {
        content: aContent,
        language: {
          name: 'JSON-LD',
          mime: 'application/ld+json'
        }
      }
    }, function () {
      pg.end();
    });
  });
}

var helper = function(cm, events) {
  events = events || {};
  var tools = {
    target: cm,
    queries: {
      qModal: null,
      qMirror: null
    },
    langInfo: langInfo,
    joins: {
      jModal: null,
      cfg: null
    },
    joinOrParse: function (progress) {
      if (tools.doc().somethingSelected()) {
        tools.joins.cfg = tools.joins.cfg || {};
        var sel = tools.doc().getSelection();
        if (!lemon.isBlank(sel)) {
          var join = [], tmp = null;
          lemon.each(sel.split(/\s/), function(v, idx) {
            if (!lemon.isBlank(tmp = lemon.trim(v))) {
              tmp = (tools.joins.cfg.l || '') + tmp;
              tmp = tmp + (tools.joins.cfg.r || '');

              join.push(tmp);
            }
          });
        }

        tools.repSelected(join.join(tools.joins.cfg.s || ','));
        progress && progress.end();
        return false;
      }

      try {
        tools.json(JSON.parse(tools.val()));
        progress && progress.end();
        return false;
      } catch (e) {/**/}

      if (tools.isJson() || tools.isXml()) {
        tools.format();
        progress && progress.end();
        return false;
      }

      var progress = progress || lemon.progressHome();
      $.post('/general/convertqs', {
        data: lemon.enc(tools.val())
      }).done(function (resp) {
        if (0 == resp.code) {
          var rdata = lemon.deepDec(resp.result);
          tools.json(rdata.parsed);
        } else {
          lemon.alert(resp.msg);
        }

        progress.end();
      });
    },
    joinSepConfigTgl: function () {
      if (!tools.joins.jModal) {
        intlJoinsModal(tools);
      }
      tools.joins.jModal.toggle();
    },
    handleCmd: function (input) {
      return cm.execCommand(input);
    },
    selected: function (noMirrorTextIfNoneSelected) {
      var text = ''; if (tools.doc().somethingSelected()) {
        text = tools.doc().getSelection();
      } else {
        if (!noMirrorTextIfNoneSelected) {
          text = tools.val();
        }
      }

      return text;
    },
    repSelected: function (code, collapse, origin) {
      tools.doc().replaceSelection(code, collapse, origin);
      tools.format();
    },
    attrs: function (optionKey, optionVal) {
      if (lemon.isJson(optionKey)) {
        lemon.each(optionKey, function (v, k) {
          cm.setOption(k, v);
        });
        return optionKey;
      }

      if (lemon.isUndefined(optionKey)) {
        return cm.options;
      }

      if (lemon.isArray(optionKey)) {
        var rAttr = {};
        lemon.each(optionKey, function (okey) {
          rAttr[okey] = cm.getOption(okey);
        });
        return rAttr;
      }

      var aVal = cm.getOption(optionKey);
      if (lemon.isUndefined(optionVal)) {
        return aVal;
      }

      cm.setOption(optionKey, optionVal);
      return aVal;
    },
    theme: function(th) {
      if (lemon.isUndefined(th)) {
        return tools.attrs('theme');
      }

      th = loadTheme(th);
      tools.attrs('theme', th);
      return th;
    },
    mode: function(lan, optionalChosenMimeOrExt) {
      if (lemon.isUndefined(lan)) {
        var rInfo = {};
        lemon.extend(rInfo, tools.langInfo(tools.attrs('mode')));
        lemon.extend(rInfo, {
          chosenMimeOrExt: tools.attrs('chosenMimeOrExt') || ''
        });
        return rInfo;
      }

      var info = tools.langInfo(lan);
      if (lemon.isBlank(info)) {
        throw Error('Could not find a mode corresponding to ' + lan);
      }

      var spec = info.mime, mode = info.mode;
      spec = 'null' == spec ? mode : spec;
      tools.attrs('mode', spec);
      tools.autoLoadMode(mode);

      if (!lemon.isUndefined(optionalChosenMimeOrExt)) {
        tools.attrs('chosenMimeOrExt', optionalChosenMimeOrExt);
      }

      return info;
    },
    autoLoadMode: function (mode) {
      if (!lemon.isFunc(CodeMirror.autoLoadMode)) {
        mirror.script('/addon/mode/loadmode.js', function () {
          CodeMirror.modeURL = lemon.fullUrl('/components/codemirror/mode/%N/%N.js');
          CodeMirror.autoLoadMode(cm, mode);
        });
      } else {
        CodeMirror.autoLoadMode(cm, mode);
      }
    },
    tip: function (msg, tipOptions) {
      return cm.openNotification('<span style="color: orange">' + msg + '</span>', lemon.extend({
        bottom: true,
        duration: 5000
      }, tipOptions || {}));
    },
    tglOption: function (optionKey) {
      tools.attrs(optionKey, !tools.attrs(optionKey));
      return tools.attrs(optionKey);
    },
    wordwrap: function() {
      return tools.tglOption('lineWrapping');
    },
    doc: function() {
      return cm.doc;
    },
    mapkey: function (keymap) {
      cm.setOption("extraKeys", lemon.extend(cm.getOption('extraKeys') || {}, keymap || {}));
    },
    toLastLine: function () {
      //cm.scrollIntoView({line: cm.lastLine()})
      tools.toLine(cm.lastLine() + 1);
    },
    toLine: function (line, ch) {
      cm.setCursor((line || 1) - 1, ch || 0)
    },
    queriesTgl: function (uncheck) {
      if (true !== uncheck) {
        if (!tools.checkIsJson()) {
          return;
        }
      }

      tools.queries.qModal && tools.queries.qModal.toggle();
    },
    queryJson: function (mongoStyleQry, fields, dlAnalyst) {
      var text = tools.selected();
      if (!mirror.isJson(text)) {
        return -1;
      }

      var aJson = mirror.parse(text);
      if (!lemon.isBlank(dlAnalyst) && lemon.isString(dlAnalyst)) {
        global.$dlEditorData = aJson; global.dl = dl;
        var aCmd = lemon.startIf(dlAnalyst, 'dl.').replace(new RegExp('\\$data', 'g'), '$dlEditorData'), aResult = '';
        try {
          aResult = lemon.exe(aCmd);
        } catch (e) {
          aResult = aJson;
          lemon.warn('mirror.queryJson try dl analyst: ' + e.message);
        }
        global.$dlEditorData = undefined; global.dl = undefined;

        if (mirror.isJson(aResult, true)) {
          aJson = aResult;
        } else {
          return aResult;
        }
      }

      return lemon.queries(mongoStyleQry, aJson, fields);
    },
    standardJsonTgl: function () {
      if (!tools.checkIsJson()) {
        return;
      }

      var text = tools.selected();
      if (mirror.isStandardJson(text)) {
        text = json5s.stringify(mirror.parse(text));
      } else {
        text = JSON.stringify(mirror.parse(text));
      }
      tools.val(lemon.fmtjson(text));
    },
    //opt 1 toggle, 2 json -> xml, 3 xml -> json
    xmlJsonTgl: function (opt) {
      var isSelected = tools.doc().somethingSelected(),
        text = tools.selected(), afterT = mirror.xmlJsonTgl(text, opt);

      if (afterT) {
        if (isSelected) {
          tools.repSelected(afterT.data);
        } else {
          tools.val(afterT.data);
        }

        return afterT.opt;
      }
    },
    //opt 1 toggle, 2 show, 3 unshow, 4 get
    guttersTgl: function (opt, options) {
      var hasGutters = ((tools.attrs('gutters') || []).length > 0);
      switch (opt = opt || 1) {
        case 1:
          return tools.guttersTgl(options, hasGutters ? 3 : 2);
        case 2:
          if (!hasGutters) {
            options = lemon.extend({
              foldGutter: true,
              lineNumbers: true,
              gutters: ['CodeMirror-linenumbers', 'CodeMirror-foldgutter']
            }, options || {});

            tools.attrs(options);
          }
          break;
        case 3:
          if (hasGutters) {
            options = lemon.extend({
              foldGutter: false,
              lineNumbers: false,
              gutters: []
            }, options || {});

            tools.attrs(options);
          }
          break;
        case 4:
          break;
      }

      return (tools.attrs('gutters') || []).length > 0;
    },
    fullscreenTgl: function (full) {
      if (!cm.getOption('fullScreen')) {
        tools.fullBefore = {
          lineNumbers: cm.getOption('lineNumbers'),
          styleActiveLine: cm.getOption('styleActiveLine')
        };
      }

      var isFullscreen = null;
      cm.setOption("fullScreen", lemon.isUndefined(full) ? !cm.getOption("fullScreen") : full);
      if (cm.getOption('fullScreen')) {
        cm.setOption('lineNumbers', true);
        cm.setOption('styleActiveLine', true);
        isFullscreen = true;
      } else {
        lemon.each(tools.fullBefore, function (v, k) {
          cm.setOption(k, v);
        });
        isFullscreen = false;
      }
      lemon.isFunc(events.fullscreen) && events.fullscreen(isFullscreen);
    },
    readonlyTgl: function (isNocursor) {
      if (!isNocursor) {
        return tools.tglOption('readOnly');
      } else {
        return tools.attrs('readOnly', 'nocursor');
      }
    },
    format: function () {
      var cursor = cm.getCursor();
      if (tools.isJson()) {
        cm.setValue(lemon.fmtjson(cm.getValue()));
      } else if (tools.isXml()) {
        cm.setValue(lemon.fmtxml(cm.getValue()));
      } else {
        return;
      }
      cm.setCursor(cursor);
      tools.refreshDelay();
    },
    chgFontSize: function (size) {
      tools.chgStyle({
        'font-size': size + 'px'
      });
    },
    chgStyle: function (styles) {
      lemon.each(styles || {}, function (v, k) {
        cm.getWrapperElement().style[k] = v;
      });
      tools.refreshDelay();
    },
    setSize: function(width, height) {
      cm.setSize(width, height);
    },
    val: function(data) {
      if (lemon.isUndefined(data)) {
        return cm.getValue();
      }

      cm.setValue(lemon.isNull(data) ? '' : data);
      tools.refreshDelay();
      return data;
    },
    checkIsJson: function (text) {
      if (!mirror.isJson(text || tools.selected())) {
        lemon.alert('The selected or content is not a valid json.');
        return false;
      }

      return true;
    },
    isJson: function() {
      return mirror.isJson(cm.getValue());
    },
    isXml: function () {
      return mirror.isXml(cm.getValue());
    },
    refreshDelay: function(delay) {
      lemon.delay(function () {
        cm.refresh();
      }, delay || 100);
    },
    cloneToNote: function () {
      return showInNote(tools.fmtIfJson());
    },
    fmtIfJson: function (data) {
      var data = data || tools.val();
      return fmtIfJson(data);
    },
    json: function(data) {
      if (lemon.isUndefined(data)) {
        return json5s.parse(cm.getValue());
      }

      cm.setValue(lemon.fmtjson(lemon.isNull(data) ? {} : data));
      tools.refreshDelay();
    }
  };

  events = lemon.extend({
    inputRead: function(cm, changeObj) {
      tools.format();
    }
  }, events);

  lemon.each(events, function (v, k) {
    //CodeMirror event
    if (customEvts.indexOf(k) == -1 && lemon.isFunc(v)) {
      cm.on(k, v);
    }
  });

  /* [
      "selectAll", "singleSelection", "killLine", "deleteLine", "delLineLeft", "delWrappedLineLeft", "delWrappedLineRight",
      "undo", "redo", "undoSelection", "redoSelection", "goDocStart", "goDocEnd", "goLineStart", "goLineStartSmart",
      "goLineEnd", "goLineRight", "goLineLeft", "goLineLeftSmart", "goLineUp", "goLineDown", "goPageUp", "goPageDown",
      "goCharLeft", "goCharRight", "goColumnLeft", "goColumnRight", "goWordLeft", "goGroupRight", "goGroupLeft", "goWordRight",
      "delCharBefore", "delCharAfter", "delWordBefore", "delWordAfter", "delGroupBefore", "delGroupAfter", "indentAuto",
      "indentMore", "indentLess", "insertTab", "insertSoftTab", "defaultTab", "transposeChars", "newlineAndIndent",
      "openLine", "toggleOverwrite", "toggleComment", "closeTag", "newlineAndIndentContinueMarkdownList", "toMatchingTag",
      "toggleFold", "fold", "unfold", "foldAll", "unfoldAll", "autocomplete", "jumpToLine", "find", "findPersistent",
      "findPersistentNext", "findPersistentPrev", "findNext", "findPrev", "clearSearch", "replace", "replaceAll",
      "wrapLines", "goNextDiff", "goPrevDiff"
    ] */
  tools.cmds = [];
  lemon.each(CodeMirror.commands, function (v, k) {
    var commandM = {};
    commandM[k] = function () {
      return tools.handleCmd(k);
    };
    lemon.register(commandM, tools);
    tools.cmds.push(k);
  });

  intlJsonQueries(tools);

  return tools;
};

var keyMappings = {
  escKey: { k: 'Esc', f: 'fullscreenTgl'},
  ctrlLKey: { k: 'Ctrl-L', f: 'guttersTgl'},

  ctrl1Key: { k: 'Ctrl-1', f: 'queriesTgl'},
  shiftCtrl1Key: { k: 'Shift-Ctrl-1', f: 'cloneToNote'},

  ctrl3Key: { k: 'Ctrl-3', f: 'joinOrParse'},
  shiftCtrl3Key: { k: 'Shift-Ctrl-3', f: 'joinSepConfigTgl'},

  ctrl4Key: { k: 'Ctrl-4', f: 'standardJsonTgl'},
  shiftCtrl4Key: { k: 'Shift-Ctrl-4', f: 'xmlJsonTgl'},
};

/**
 *
 * @param elId
 * @param options {
 *  cust: {
 *    escKey: true,           //toggle fullscreen
 *    ctrlLKey: true,         //gutters toggle
 *    ctrl1Key: true,         //query JSON
 *    shiftCtrl1Key: true,    //clone current content to a new note
 *    ctrl3Key: true,         //join or parse string
 *    shiftCtrl3Key: true,    //toggle join or parse config
 *    ctrl4Key: true,         //standard JSON string toggle
 *    shiftCtrl4Key: true,    //JSON <=> XML
 *  }
 * }
 * @param events {
 *  fullscreen: function(isFullscreen) {}
 * }
 * @see http://codemirror.net/doc/manual.html#events
 */
var mirror = function (elId, options, events) {
  options = options || {}, events = events || {};

  //default order (Shift-Cmd-Ctrl-Alt)
  var custOptions = lemon.extend({
    escKey: true,          //fullscreen toggle
    ctrlLKey: true,        //gutters toggle

    ctrl1Key: true,        //query JSON
    shiftCtrl1Key: true,   //clone current content to a new note

    ctrl3Key: true,       //join or parse string
    shiftCtrl3Key: true,  //toggle join or parse config

    ctrl4Key: true,         //standard JSON string toggle
    shiftCtrl4Key: true,    //JSON <=> XML
  }, options.cust || {});
  delete options.cust;

  var extraKeys = lemon.extend({
    //http://codemirror.net/doc/manual.html#commands
    'Ctrl-K': 'toMatchingTag',
    'Ctrl-J': 'autocomplete',
    'Ctrl-Q': 'toggleFold',
  }, options.extraKeys || {});
  delete options.extraKeys;

  var rich = CodeMirror.fromTextArea(lemon.query(lemon.startIf(elId, '#')), lemon.extend({
      autofocus: false,
      lineNumbers: false,
      matchBrackets: true,
      theme: 'lemon',
      styleActiveLine: false,
      readOnly: false,
      mode: "application/ld+json",
      autoCloseBrackets: true,
      autoCloseTags: true,
      lineWrapping: true,
      foldGutter: true,
      content: '',
      gutters: ["CodeMirror-linenumbers", "CodeMirror-foldgutter"],
      matchTags: {
        bothTags: true
      },
      extraKeys: extraKeys
    }, options)
  );

  var aHelp = helper(rich, events), custKeys = {};

  lemon.each(lemon.keys(custOptions), function (ck) {
    if (true === custOptions[ck]) {
      var km = keyMappings[ck];
      if (lemon.isString(km.f)) {
        custKeys[km.k] = function (cm) {
          return aHelp[km.f]();
        };
      } else if (lemon.isFunc(km.f)) {
        custKeys[km.k] = function (cm) {
          return km.f(aHelp);
        };
      }
    }
  });

  if (!lemon.isBlank(custKeys)) {
    aHelp.mapkey(custKeys);
  }

  return aHelp;
};

mirror.asStandardJsonObj = function (target) {
  if (lemon.isString(target)) {
    target = mirror.parse(target);
  }

  return JSON.parse(JSON.stringify(target));
};

mirror.xmlJsonTgl = function (text, opt) {
  //opt 1 toggle, 2 json -> xml, 3 xml -> json
  var toX = function (aText) {
    var xmlT = '', jsonObj = mirror.asStandardJsonObj(aText);
    if (lemon.keys(jsonObj).length > 1) {
      xmlT = '<?xml version="1.0" encoding="UTF-8"?>';
      jsonObj = {
        lemon: jsonObj
      };
    }

    return {
      opt: 2,
      data: lemon.fmtxml(xmlT + X2JS.json2xml_str(jsonObj))
    };
  }, toJ = function (aText) {
    var theJ = null, jsonObj = X2JS.xml_str2json(aText);
    if (jsonObj && lemon.has(jsonObj, 'lemon')) {
      theJ = jsonObj.lemon;
    } else {
      theJ = jsonObj;
    }

    return {
      opt: 3,
      data: lemon.fmtjson(theJ)
    };
  };

  switch (opt = opt || 1) {
    case 1:
      if (mirror.isJson(text, true)) {
        return toX(text);
      } else if (mirror.isXml(text, true)) {
        return toJ(text);
      }
      break;
    case 2:
      if (mirror.isJson(text, true)) {
        return toX(text);
      }
      break;
    case 3:
      if (mirror.isXml(text, true)) {
        return toJ(text);
      }
      break;
  }
};

mirror.isXml = function (target, noneLogWarnMsg) {
  try {
    $.parseXML(target);
  } catch (e) {
    if (!noneLogWarnMsg) {
      lemon.warn('mirror.isXML: ' + e.message);
    }
    return false;
  }
  return true;
};

mirror.isJson = function(target, noneLogWarnMsg) {
  try {
    if (!lemon.isString(target)) {
      target = json5s.stringify(target);
    }
    json5s.parse(target);
  } catch (e) {
    if (!noneLogWarnMsg) {
      lemon.warn('mirror.isJson: ' + e.message);
    }
    return false;
  }
  return true;
};

mirror.isStandardJson = function(target, noneLogWarnMsg) {
  try {
    if (!lemon.isString(target)) {
      target = JSON.stringify(target);
    }
    JSON.parse(target);
  } catch (e) {
    if (!noneLogWarnMsg) {
      lemon.warn('mirror.isStandardJson: ' + e.message);
    }
    return false;
  }
  return true;
};

mirror.parse = function (target) {
  if (!lemon.isString(target)) {
    target = json5s.stringify(target);
  }
  return json5s.parse(target);
};

mirror.highlight = function(target, mode, output) {
  CodeMirror.runMode(lemon.query(target).value, mode, lemon.query(output));
};

var htmpl = [
  '<textarea style="display: none;" id="hsrc_<%= id %>"></textarea>',
  '<div  id="hctx_<%= id %>" style="display: none;"><pre class="CodeMirror cm-s-<%= theme %>"></pre></div>'
].join('');

mirror.highlights = function(options) {
  options = lemon.extend({
    input: '',
    outputEl: '',           //alternative options.resultHandle
    beforeHandle: false,    //after highlight and before final result generate event, function(preEl) {}
    resultHandle: false,    //alternative options.outputEl, function (highlighted, modeInfo, theme) {}
    doneHandle: false,      //call when is done, function (highlighted, modeInfo, theme) {}
    mode: 'text',
    theme: 'default',

    rightTip: '',       //right corner tip
    inputIsEl: false,
    inputIsEncode: false,
    style: {
      height: '100%',
      margin: 0,
      padding: '1rem',
      'overflow-x': 'auto'
    },
    attrs: {},

    id: lemon.now() + '_' + lemon.uniqueId()
  }, options || {});

  var content = options.input, hsrc = '#hsrc_' + options.id,
    hctx = '#hctx_' + options.id, hpre = hctx + ' pre';
  if (options.inputIsEl) {
    content = lemon.query(content).value;
  }

  if (options.inputIsEncode) {
    content = lemon.dec(content);
  }

  options.theme = mirror.requireTheme(options.theme);
  $('body').append(lemon.tmpl(htmpl, options));
  $(hsrc).val(content);
  if (!lemon.isBlank(options.style)) {
    $(hpre).css(options.style);
  }
  if (!lemon.isBlank(options.attrs)) {
    $(hpre).css(options.attrs);
  }

  mirror.requireMode(options.mode, function (modeInfo) {
    mirror.highlight(hsrc, modeInfo.mime, hpre);
    if (!lemon.isBlank(options.rightTip)) {
      $(hpre).prepend(lemon.format('<p class="pull-right text-muted">{0}</p>', options.rightTip));
    }

    lemon.isFunc(options.beforeHandle) && options.beforeHandle(hpre);
    var theOutput = $(hctx).html();
    $(hsrc + ',' + hctx).remove();

    if (lemon.isFunc(options.resultHandle)) {
      options.resultHandle(theOutput, modeInfo, options.theme);
    } else if (options.outputEl && $(options.outputEl).length) {
      $(options.outputEl).html(theOutput);
    }

    lemon.isFunc(options.doneHandle) && options.doneHandle(theOutput, modeInfo, options.theme);
  });
};

mirror.helpers = helper;
mirror.modeInfo = langInfo;
mirror.requireTheme = loadTheme;
mirror.requireMode = function (mode, callback) {
  var lang = langInfo(mode), reqM = function (aMode) {
    if (!CodeMirror.modes.hasOwnProperty(aMode)) {
      CodeMirror.requireMode(aMode, function() {
        lemon.isFunc(callback) && callback(lang);
      });
    } else {
      lemon.isFunc(callback) && callback(lang);
    }
  };

  if (!lemon.isFunc(CodeMirror.autoLoadMode)) {
    mirror.script('/addon/mode/loadmode.js', function () {
      CodeMirror.modeURL = lemon.fullUrl('/components/codemirror/mode/%N/%N.js');
      reqM(lang.mode);
    });
  } else {
    reqM(lang.mode);
  }
};

mirror.highlightJson5 = function(text, output) {
  $(output).addClass('cm-s-lemon');
  CodeMirror.runMode(text, 'application/ld+json', lemon.query(output));
};

mirror.showJson = function(target, output) {
  output = output || target;
  $(output).addClass('cm-s-lemon');
  mirror.highlight(target, 'application/ld+json', output);
};

mirror.script = function (target, callback) {
  lemon.script(lemon.fullUrl('/components/codemirror' + target), function (data) {
    lemon.isFunc(callback) && callback(data);
  });
};

mirror.themes = themes;
mirror.languages = languages;
mirror.X2JS = X2JS;
mirror.X2JSFactory = X2JSFactory;
mirror.css = function (target) {
  lemon.css(lemon.fullUrl('/components/codemirror' + target));
};

module.exports = mirror;
