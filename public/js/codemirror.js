/**
 *
 */
require('codemirror/lib/codemirror.css');

var CodeMirror = require('codemirror/lib/codemirror'),
  json5s = require('./json5s')
  ;
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

var languages = {}, modes = {}, loadingScript = false;
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

var helper = function(cm, events) {
  events = events || {};
  var tools = {
    target: cm,
    handleCmd: function (input) {
      cm.execCommand(input);
    },
    selectAll: function () {
      tools.handleCmd('selectAll');
    },
    langInfo: function(lang) {
      if (lemon.isBlank(lang)) {
        return null;
      }

      var m, info = null;
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

      return null;
    },
    attrs: function (optionKey, optionVal) {
      if (lemon.isUndefined(optionKey)) {
        return cm.options;
      }

      var aVal = cm.getOption(optionKey);
      if (lemon.isUndefined(optionVal)) {
        return aVal;
      }

      cm.setOption(optionKey, optionVal);
      return aVal;
    },
    mode: function(lan) {
      if (lemon.isUndefined(lan)) {
        return tools.langInfo(tools.attrs('mode'));
      }

      var info = tools.langInfo(lan);
      if (lemon.isBlank(info)) {
        throw Error('Could not find a mode corresponding to ' + lan);
      }

      var spec = info.mime, mode = info.mode;
      info.isJson = 'json' == lan.toLocaleLowerCase();
      if (info.isJson) {
        spec = 'application/ld+json';
        tools.attrs('theme', 'lemon');
      }

      tools.attrs('mode', spec);
      if (!info.isJson) {
        tools.autoLoadMode(mode);
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
    doc: function() {
      return cm.doc;
    },
    mapkey: function (keymap) {
      cm.setOption("extraKeys", lemon.extend(cm.getOption('extraKeys'), keymap || {}));
    },
    toLastLine: function () {
      cm.scrollIntoView({line: cm.lastLine()})
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
    format: function () {
      var cursor = cm.getCursor();
      cm.setValue(lemon.fmtjson(cm.getValue()));
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
    isJson: function() {
      return mirror.isJson(cm.getValue());
    },
    refreshDelay: function(delay) {
      lemon.delay(function () {
        cm.refresh();
      }, delay || 100);
    },
    json: function(data) {
      if (lemon.isUndefined(data)) {
        return json5s.parse(cm.getValue());
      }

      cm.setValue(lemon.fmtjson(lemon.isNull(data) ? {} : data));
      tools.refreshDelay();
    }
  };

  return tools;
};

/**
 *
 * @param elId
 * @param options {
 *  cust: {
 *    escKey: true    // toggle fullscreen
 * }
 * @param events {
 *  fullscreen: function(isFullscreen) {}
 * }
 * @see http://codemirror.net/doc/manual.html#events
 */
var mirror = function (elId, options, events) {
  options = options || {}, events = events || {}, customEvts = [
    'fullscreen'
  ];

  var custOptions = lemon.extend({
    escKey: true
  }, options.cust || {});
  delete options.cust;

  var extraKeys = lemon.extend({
    //http://codemirror.net/doc/manual.html#commands
    "Ctrl-K": "toMatchingTag",
    "Ctrl-J": "autocomplete",
    "Ctrl-Q": function (cm) {
      cm.foldCode(cm.getCursor());
    }
  }, options.extraKeys || {});
  delete options.extraKeys;

  var rich = CodeMirror.fromTextArea(lemon.query(lemon.startIf(elId, '#')), lemon.extend({
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

  var aHelp = helper(rich, events);

  events = lemon.extend({
    inputRead: function(cm, changeObj) {
      if (aHelp.isJson()) {
        aHelp.format();
      }
    }
  }, events);

  lemon.each(events, function (v, k) {
    //CodeMirror event
    if (customEvts.indexOf(k) == -1 && lemon.isFunc(v)) {
      rich.on(k, v);
    }
  });

  if (custOptions.escKey) {
    aHelp.mapkey({
      "Esc": function (cm) {
        aHelp.fullscreenTgl();
      }
    });
  }

  return aHelp;
};

mirror.isJson = function(target) {
  try {
    json5s.parse(target);
  } catch (e) {
    lemon.warn('mirror.isJson: ' + e.message);
    return false;
  }
  return true;
};

mirror.highlight = function(target, mode, output) {
  CodeMirror.runMode(lemon.query(target).value, mode, lemon.query(output));
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
  loadingScript = true;
  global.CodeMirror = CodeMirror;
  lemon.script(lemon.fullUrl('/components/codemirror' + target), function (data) {
    lemon.isFunc(callback) && callback(data);
    loadingScript = false;
    lemon.delay(function () {
      if (!loadingScript) {
        global.CodeMirror = undefined;
      }
    }, 10000);
  });
};

mirror.css = function (target) {
  lemon.css(lemon.fullUrl('/components/codemirror' + target));
};

mirror.CodeMirror = CodeMirror;
module.exports = mirror;
