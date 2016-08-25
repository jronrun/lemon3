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
    exbody.exHandle(cm, lemon.extend({
      args: [],
      argString: '',
      input: '',
      line: false,
      commandName: ''
    }, params));
  });

  definedEx.push(exbody);
}

var noteMirror = function (elId, options, events) {
  var aMirror = mirror(elId, lemon.extend({
    mode: 'htmlmixed',
    keyMap: 'vim',
    fullScreen: true,
    lineNumbers: true,
    showCursorWhenSelecting: true,
    styleActiveLine: true,
    extraKeys: {
      "Ctrl-/": "toggleComment",
      "Ctrl-A": function(cm) {
        aMirror.selectAll();
      }
    },
    cust: {
      escKey: false
    }
  }, options || {}), lemon.extend({
    inputRead: function(cm, changeObj) {

    }
  }, events || {})), aTarget = aMirror.target;

  lemon.extend(aMirror, {
    vim: {
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
      }
    }
  });

  aMirror.autoLoadMode('htmlmixed');

  return aMirror;
};


lemon.extend(noteMirror, {
  mirrors: mirror,
  defineEx: defineEx
});

module.exports = noteMirror;
