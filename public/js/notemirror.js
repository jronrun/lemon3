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
  var tools = {
    target: target
  };

  return tools;
};

var mergeMirror = function (options) {
  options = lemon.extend({
    elId: '',
    mergedval: '',
    panes: 2,
    orig1: '',
    orig2: '',
    connect: null,
    mode: '',
    lineNumbers: true,
    revertButtons: true,
    showDifferences: true,
    highlightDifferences: true,
    collapseIdentical: false,
    allowEditingOriginals: false,
    height: $(window).height() - 65,
    top: 54
  }, options || {});

  var mv = CodeMirror.MergeView(lemon.query(options.elId), {
    value: options.mergedval,
    origLeft: options.panes == 3 ? options.orig1 : null,
    orig: options.orig2,
    lineNumbers: options.lineNumbers,
    mode: options.mode,
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

  return helper(mv);
};


lemon.extend(noteMirror, {
  merge: mergeMirror,
  mirrors: mirror,
  defineEx: defineEx
});

module.exports = noteMirror;
