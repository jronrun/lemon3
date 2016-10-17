/**
 *
 */
var mirror = require('../js/codemirror');
require('bootstrap/js/dist/tooltip');
require('bootstrap/js/dist/modal');
require('imports?require=>false,define=>false,module=>false!summernote');
mirror.requireMode('html');

// lemon.css(lemon.fullUrl('/components/summernote/dist/summernote.css'));
var theAPIs = {
  basic: [
    'createRange', 'saveRange', 'restoreRange', 'undo', 'redo',
    'focus', 'isEmpty', 'reset', 'disable', 'enable'
  ],
  font: [
    'bold', 'italic', 'underline', 'strikethrough', 'superscript', 'subscript',
    'removeFormat', 'backColor', 'foreColor', 'fontName', 'fontSize'
  ],
  paragraph: [
    'justifyLeft', 'justifyRight', 'justifyCenter', 'justifyFull', 'insertParagraph', 'insertOrderedList',
    'insertUnorderedList', 'indent', 'outdent', 'formatPara', 'formatH2', 'formatH6', 'lineHeight'
  ],
  insert: [
    'insertImage', 'insertNode', 'insertText', 'createLink', 'unlink'
  ],
  findInCode: [
    'setHeight', 'empty', 'hasFocus'
  ]
}, createInstance = function (elId, events, options) {
  events = lemon.extend({
    init: null,
    enter: null,
    focus: null,
    blur: null,
    keyup: null,
    keydown: null,
    paste: null,
    change: null,
    'image.upload': null,
    'codeview.toggled': null
  }, events || {});

  options = lemon.extend({
    fullsize: true,
    codemirror: {
      htmlMode: true,
      lineNumbers: true,
      matchBrackets: true,
      theme: 'lemon',
      styleActiveLine: true,
      mode: 'text/html',
      autoCloseBrackets: true,
      autoCloseTags: true,
      lineWrapping: true,
      foldGutter: true,
      content: '',
      gutters: ["CodeMirror-linenumbers", "CodeMirror-foldgutter"],
      matchTags: {
        bothTags: true
      }
    }
  }, options || {});

  if (!options.height && true === options.fullsize) {
    options.height = options.minHeight = options.maxHeight = ($(window).height() - 50);
  }

  delete options.callbacks;
  var inst = helper(elId, events, options);
  $(elId).summernote(options);

  if (true === options.airMode) {
    inst.airbarHide();
  }

  if (inst.layout && inst.layout.editor) {
    inst.layout.editor.css({
      'border-color': '#d9edf7'
    });
  }

  return inst;
};

var helper = function (elId, events, options) {
  events = events || {};
  options = options || {};
  var tools = {
    id: elId,
    //type 1 air, 2 normal
    type: true === options.airMode ? 1 : 2,
    layout: null,
    ui: $.summernote.ui,

    action: function () {
      var len = arguments.length, arg = arguments, $el = $(tools.id);
      switch (len) {
        case 1: return $el.summernote(arg[0]);
        case 2: return $el.summernote(arg[0], arg[1]);
        case 3: return $el.summernote(arg[0], arg[1], arg[2]);
        case 4: return $el.summernote(arg[0], arg[1], arg[2], arg[3]);
        case 5: return $el.summernote(arg[0], arg[1], arg[2], arg[3], arg[4]);
        case 6: return $el.summernote(arg[0], arg[1], arg[2], arg[3], arg[4], arg[5]);
      }
    },
    modeTgl: function () {
      return tools.refresh({
        airMode: !options.airMode
      });
    },
    refresh: function (refreshOptions, refreshEvents) {
      $('.tooltip').tooltip('hide');
      tools.action('destroy');
      refreshOptions = lemon.extend(options, refreshOptions || {});
      refreshEvents = lemon.extend(events, refreshEvents || {});
      return createInstance(tools.id, refreshEvents, refreshOptions);
    },
    val: function (html) {
      if (lemon.isUndefined(html)) {
        return tools.action('code');
      }

      if (tools.isMirrorActivated()) {
        tools.mirror().val(html);
      } else {
        tools.action('code', html);
      }

      return tools.action('code');
    },
    isAirMode: function () {
      return options.airMode;
    },
    airbarHide: function () {
      return tools.action('airPopover.hide');
    },
    toolbarDeactivate: function (isIncludeCodeview) {
      return tools.action('toolbar.deactivate', isIncludeCodeview);
    },
    toolbarActivate: function (isIncludeCodeview) {
      return tools.action('toolbar.activate', isIncludeCodeview);
    },
    //1 toggle, 2 active, 3 unactive
    toolbarTgl: function (opt) {
      var bar = null;
      if (!tools.layout || !(bar = tools.layout.toolbar)) {
        return false;
      }
      opt = opt || 1;
      switch (opt) {
        case 1: bar.toggle(); break;
        case 2: if (bar.is(':hidden')) { bar.show(); } break;
        case 3: if (bar.is(':visible')) { bar.hide(); } break;
      }
      return bar.is(':visible');
    },
    fullscreenTgl: function () {
      return tools.action('fullscreen.toggle');
    },
    isFullscreen: function () {
      return tools.action('fullscreen.isFullscreen');
    },
    isMirrorActivated: function () {
      if (!tools.layout || !tools.layout.codable || !$(tools.layout.codable).data('cmEditor')) {
        return false;
      }

      return tools.action('codeview.isActivated');
    },
    mirrorTgl: function () {
      return tools.action('codeview.toggle');
    },
    mirror: function () {
      if (!tools.isMirrorActivated()) {
        return null;
      }

      return mirror.helpers($(tools.layout.codable).data('cmEditor'));
    }
  };

  lemon.each(theAPIs, function (v, k) {
    lemon.each(v, function (n) {
      tools[n] = function () {
        var args = [n];
        Array.prototype.push.apply(args, arguments);
        return tools.action.apply(this, args);
      };
    });
  });

  lemon.each(['codeview.toggled', 'init', 'keydown'], function (chk) {
    if (!lemon.isFunc(events[chk])) {
      events[chk] = function () {/**/}
    }
  });

  lemon.each(events, function (v, k) {
    if (lemon.isFunc(v)) {
      $(tools.id).on('summernote.' + k, function(a, b, c, d) {
        if ('init' === k) {
          tools.layout = b;
        } else if ('codeview.toggled' === k) {
          if (options.height) {
            tools.setHeight(options.height);
          }
        } else if ('keydown' === k) {
          if (27 === b.keyCode || 'Escape' === b.key) {
            tools.modeTgl();
          }
        }

        return v(a, b, c, d);
      });
    }
  });

  return tools;
};

var summer = function (elId, options, events) {
  return createInstance(elId, events, options);
};

lemon.extend(summer, {
  mirror: mirror
});

module.exports = summer;
