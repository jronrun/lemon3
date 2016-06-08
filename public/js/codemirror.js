/**
 *
 */
require('codemirror/lib/codemirror.css');

var CodeMirror = require('codemirror/lib/codemirror'),
  json5s = require('./json5s');
global._ = {};  //for json5s
_.each = lemon.each;

lemon.fmtjson = function(target) {
  return json5s.format(target);
};

require('codemirror/addon/runmode/runmode');

require('codemirror/mode/javascript/javascript');

var helper = function(cm) {
  var tools = {
    target: cm,
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

      cm.setOption("fullScreen", lemon.isUndefined(full) ? !cm.getOption("fullScreen") : full);
      if (cm.getOption('fullScreen')) {
        cm.setOption('lineNumbers', true);
        cm.setOption('styleActiveLine', true);
      } else {
        lemon.each(tools.fullBefore, function (v, k) {
          cm.setOption(k, v);
        });
      }
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
      try {
        json5s.parse(cm.getValue());
      } catch (e) {
        lemon.warn('codemirror.isJson: ' + e.message);
        return false;
      }
      return true;
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

var mirror = function (elId, options) {
  options = options || {};
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
      extraKeys: {
        //http://codemirror.net/doc/manual.html#commands
        "Esc": function (cm) {
          helper.fullscreenTgl(cm)
        },
        "Ctrl-K": "toMatchingTag",
        "Ctrl-J": "autocomplete",
        "Ctrl-Q": function (cm) {
          cm.foldCode(cm.getCursor());
        }
      }
    }, options)
  );

  return helper(rich);
};

mirror.highlight = function(target, mode, output) {
  CodeMirror.runMode(lemon.query(target).value, mode, lemon.query(output));
};

mirror.showJson = function(target, output) {
  output = output || target;
  $(output).addClass('cm-s-lemon');
  mirror.highlight(target, 'application/ld+json', output);
};

module.exports = mirror;
