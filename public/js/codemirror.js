/**
 *
 */
require('codemirror/lib/codemirror.css');

var CodeMirror = require('codemirror/lib/codemirror'),
  json5s = require('./json5s');

lemon.fmtjson = function(target) {
  if (lemon.isString(target)) {
    target = json5s.parse(target);
  }
  return json5s.fmtjson(target);
};

require('codemirror/addon/runmode/runmode');

require('codemirror/mode/javascript/javascript');

var helper = function(cm) {
  return {
    target: cm,
    mapkey: function (keymap) {
      cm.setOption("extraKeys", lemon.extend(cm.getOption('extraKeys'), keymap || {}));
    },
    toLastLine: function () {
      cm.scrollIntoView({line: cm.lastLine()})
    },
    fullscreenTgl: function (full) {
      if (!cm.getOption('fullScreen')) {
        helper.fullBefore = {
          lineNumbers: cm.getOption('lineNumbers'),
          styleActiveLine: cm.getOption('styleActiveLine')
        };
      }

      cm.setOption("fullScreen", lemon.isUndefined(full) ? !cm.getOption("fullScreen") : full);
      if (cm.getOption('fullScreen')) {
        cm.setOption('lineNumbers', true);
        cm.setOption('styleActiveLine', true);
      } else {
        lemon.each(helper.fullBefore, function (v, k) {
          cm.setOption(k, v);
        });
      }
    },
    format: function () {
      var cursor = cm.getCursor();
      cm.setValue(lemon.fmtjson(cm.getValue()));
      cm.setCursor(cursor);
    },
    chgFontSize: function (size) {
      helper.chgStyle({
        'font-size': size + 'px'
      });
    },
    chgStyle: function (styles) {
      lemon.each(styles || {}, function (v, k) {
        cm.getWrapperElement().style[k] = v;
      });
      cm.refresh();
    },
    setSize: function(width, height) {
      cm.setSize(width, height);
    },
    val: function(data) {
      if (lemon.isUndefined(data)) {
        return cm.getValue();
      }

      cm.setValue(lemon.isNull(data) ? '' : data);
      return data;
    },
    isJson: function() {
      try {
        $.parseJSON(cm.getValue());
      } catch (e) {
        return false;
      }
      return true;
    },
    json: function(data) {
      if (lemon.isUndefined(data)) {
        return $.parseJSON(cm.getValue());
      }

      cm.setValue(lemon.fmtjson(lemon.isNull(data) ? {} : data));
    }
  };
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
