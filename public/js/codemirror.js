/**
 *
 */
require('codemirror/lib/codemirror.css');

var CodeMirror = require('codemirror/lib/codemirror'),
  json5s = require('./json5s');
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

require('codemirror/mode/javascript/javascript');

lemon.fmtjson = function(target) {
  if (!lemon.isString(target)) {
    target = json5s.stringify(target);
  }
  return json5s.format(target);
};

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

mirror.script = function (target) {
  global.CodeMirror = CodeMirror;
  lemon.script(lemon.fullUrl('/components/codemirror' + target), function () {
    global.CodeMirror = undefined;
  });
};

mirror.css = function (target) {
  lemon.css(lemon.fullUrl('/components/codemirror' + target));
};

mirror.CodeMirror = CodeMirror;
module.exports = mirror;
