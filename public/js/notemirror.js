/**
 *
 */
var mirror = require('./codemirror')
  ;

/*
 require('codemirror/lib/codemirror.css');
 require('codemirror/lib/codemirror');
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

 require('codemirror/addon/scroll/annotatescrollbar');

 require('codemirror/addon/runmode/runmode');

 //unload in codemirror


 require('codemirror/addon/mode/loadmode');
 require('codemirror/addon/mode/multiplex');
 require('codemirror/addon/mode/multiplex_test');

 require('codemirror/addon/mode/overlay');
 require('codemirror/addon/mode/simple');

 require('codemirror/addon/runmode/colorize');
 require('codemirror/addon/runmode/runmode/node');
 require('codemirror/addon/runmode/runmode-standalone');

 require('codemirror/addon/scroll/scrollpastend');
 require('codemirror/addon/scroll/simplescrollbars.css');
 require('codemirror/addon/scroll/simplescrollbars');

 require('codemirror/addon/tern/tern.css');
 require('codemirror/addon/tern/tern');
 require('codemirror/addon/tern/worker');

 require('codemirror/keymap/emacs');
 require('codemirror/keymap/sublime');
 */

require('codemirror/addon/display/rulers');
require('codemirror/addon/edit/trailingspace');

require('codemirror/addon/lint/coffeescript-lint');
require('codemirror/addon/lint/css-lint');
require('codemirror/addon/lint/html-lint');
require('codemirror/addon/lint/javascript-lint');
require('codemirror/addon/lint/json-lint');
require('codemirror/addon/lint/lint.css');
require('codemirror/addon/lint/lint');
require('codemirror/addon/lint/yaml-lint');

require('./diff_match_patch_20121119/diff_match_patch.js');
require('codemirror/addon/merge/merge.css');
require('codemirror/addon/merge/merge');

require('codemirror/keymap/vim');

var definedEx = [];

function defineEx(cmd, exHandle, desc, shortCmd) {
  if (!cmd || !lemon.isFunc(exHandle)) {
    return definedEx;
  }

  var exbody = {
    cmd: cmd,
    shortCmd: shortCmd || cmd,
    exHandle: exHandle,
    desc: desc || ''
  };

  CodeMirror.Vim.defineEx(exbody.cmd, exbody.shortCmd, function(cm, params) {
    params = lemon.extend({
      args: [],
      argString: '',
      input: '',
      line: false,
      commandName: ''
    }, params);

    params.get = function(index, defaultValue) {
      index = index || 0; defaultValue = defaultValue || undefined;
      if (params.args && params.args.length > index) {
        return params.args[index];
      }

      return defaultValue;
    };
    exbody.exHandle(params, cm);
  });

  definedEx.push(exbody);
}

var noteMirror = function (elId, options, events) {
  var aMirror = mirror(elId, lemon.extend({
    mode: 'htmlmixed',
    keyMap: 'vim',
    fullScreen: true,
    autofocus: true,
    lineNumbers: true,
    lineNumberFormatter: function (line) {
      return 1 == line ? '' : line;
    },
    showCursorWhenSelecting: true,
    styleActiveLine: true,
    extraKeys: {
      "Ctrl-/": 'toggleComment',
      "Ctrl-A": 'selectAll'
    },
    cust: {
      escKey: false
    }
  }, options || {}), lemon.extend({
    inputRead: function(cm, changeObj) {

    }
  }, events || {})), aTarget = aMirror.target;

  var vimTools = {
    visualMode: function() {
      return CodeMirror.Vim.exitInsertMode(aTarget);
    },
    handleEx: function(input) {
      return CodeMirror.Vim.handleEx(aTarget, input);
    },
    handleKey: function(input, origin) {
      return CodeMirror.Vim.handleKey(aTarget, input, origin);
    },
    editMode: function() {
      return aMirror.vim.handleKey('i');
    },
    joinLine: function (startLine, endLine) {
      var start = startLine || 0, end = endLine || aTarget.lineCount();
      var cursor = aTarget.getCursor();

      var tmpCursor = lemon.clone(cursor);
      tmpCursor.line = start;
      aTarget.setCursor(tmpCursor);
      for (var idx = start; idx < end; idx++) {
        vimTools.handleKey('J');
      }
      aTarget.setCursor(cursor);
    },
  };

  lemon.extend(aMirror, {
    vim: vimTools
  });

  aMirror.autoLoadMode('htmlmixed');

  return aMirror;
};

var helper = function (target) {
  var is2Panels = 2 == target.extras.panels,
    vLeft = is2Panels ? mirror.helpers(target.editor()) : mirror.helpers(target.leftOriginal()),
    vMiddle = is2Panels ? null : mirror.helpers(target.editor()),
    vRight = mirror.helpers(target.rightOriginal());

  var tools = {
    target: target,
    left: vLeft,
    middle: vMiddle,
    right: vRight,

    tglOption: function (optionKey) {
      tools.attrs(optionKey, !tools.attrs(optionKey));
      return tools.attrs(optionKey);
    },
    attrs: function (optionKey, optionVal) {
      if (lemon.isJson(optionKey)) {
        lemon.each(optionKey, function (v, k) {
          target.options[k] = v;
        });
        return optionKey;
      }

      if (lemon.isUndefined(optionKey)) {
        return target.options;
      }

      if (lemon.isArray(optionKey)) {
        var rAttr = {};
        lemon.each(optionKey, function (okey) {
          rAttr[okey] = target.options[okey];
        });
        return rAttr;
      }

      var aVal = target.options[optionKey];
      if (lemon.isUndefined(optionVal)) {
        return aVal;
      }

      target.options[optionKey] = optionVal;
      return aVal;
    },

    alignTgl: function () {

    },
    collapseTgl: function () {

    },
    differencesTgl: function (manual) {
      var val = lemon.isUndefined(manual) ? !tools.attrs('highlightDifferences') : manual;
      target.setShowDifferences(val);
      return !tools.attrs('highlightDifferences', val);
    },
    refresh: function (options) {
      var prevAttrs = tools.attrs(), newOptions = target.extras,
        pnum = newOptions.panels, is2Panels = 2 == pnum;
      lemon.extend(newOptions, prevAttrs, options = options || {});

      var viewVals = {};
      if (!lemon.has(options, 'orig1')) {
        viewVals.left = is2Panels ? target.editor().getValue() : target.leftOriginal().getValue();
      }

      if (!lemon.has(options, 'orig2')) {
        viewVals.right = target.rightOriginal().getValue();
      }

      if (!lemon.has(options, 'value')) {
        viewVals.middle = target.editor().getValue();
      }

      $(newOptions.elId).empty();
      var inst = mergeMirror(newOptions), vcm = null;
      lemon.each(viewVals, function (val, view) {
        if (null != (vcm = inst[view])) {
          vcm.val(val);
        }
      });

      return inst;
    },

    panelsTgl: function() {
      var orig1 = '', orig2 = target.rightOriginal().getValue(),
        value = target.editor().getValue(), pnum = null;

      switch (target.extras.panels) {
        case 2:
          orig1 = value;
          pnum = 3;
          break;
        case 3:
          orig1 = target.leftOriginal().getValue();
          pnum = 2;
          break;
      }

      return tools.refresh({
        orig1: orig1,
        orig2: orig2,
        value: value,
        panels: pnum
      });
    },
  };

  return tools;
};

/**
 *
 * panels 3:
 * orig1  value  orig2
 *
 * panels 2:
 * value  orig2
 * @param options
 */
var mergeMirror = function (options) {
  lemon.info(options);

  options = lemon.extend({
    elId: '',
    top: 54,
    height: $(window).height() - 65,
    panels: 2,

    orig1: '',
    orig2: '',

    value: '',

    connect: null,
    mode: '',
    lineNumbers: true,
    revertButtons: true,
    showDifferences: true,
    highlightDifferences: true,
    collapseIdentical: false,
    allowEditingOriginals: true
  }, options || {});

  var aMode = null, minfo = null; if (aMode = options.mode) {
    if (!lemon.isBlank(minfo = mirror.modeInfo(aMode))) {
      aMode = minfo.mode;
    }
  }

  var mv = CodeMirror.MergeView(lemon.query(options.elId), {
    value: options.value,
    origLeft: options.panels == 3 ? options.orig1 : null,
    orig: options.orig2,
    lineNumbers: options.lineNumbers,
    mode: aMode,
    revertButtons: options.revertButtons,
    showDifferences: options.showDifferences,
    highlightDifferences: options.highlightDifferences,
    connect: options.connect,
    collapseIdentical: options.collapseIdentical,
    allowEditingOriginals: options.allowEditingOriginals
  });

  var me, ml, mr;
  if (me = mv.editor()) {
    me.setSize(null, options.height);
  }
  if (ml = mv.leftOriginal()) {
    ml.setSize(null, options.height);
  }
  if (mr = mv.rightOriginal()) {
    mr.setSize(null, options.height);
  }

  $(mv.wrap).css({
    top: options.top,
    border: 'none'
  }).find('.CodeMirror-merge-gap').css({
    height: options.height,
    'border-color': '#d9edf7',
    'background-color': '#ffffff'
  });
  $(mv.wrap).find('.CodeMirror-gutters').css({
    border: 'none',
    'background-color': '#ffffff'
  });

  mv.extras = {
    elId: options.elId,
    top: options.top,
    height: options.height,
    panels: options.panels
  };

  return helper(mv);
};


lemon.extend(noteMirror, {
  merge: mergeMirror,
  mirrors: mirror,
  defineEx: defineEx
});

module.exports = noteMirror;
