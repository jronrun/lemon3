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
    'image.upload': null,
    change: null
  }, events || {});

  options = lemon.extend({
    fullscreen: true
  }, options || {});

  delete options.callbacks;
  var inst = helper(elId, events, options);
  $(elId).summernote(options);

  if (true === options.airMode) {
    inst.airbarHide();
  }

  if (true === options.fullscreen && !inst.isFullscreen()) {
    inst.fullscreenTgl();
  }

  return inst;
};

var helper = function (elId, events, options) {
  events = events || {};
  options = options || {};
  var tools = {
    id: elId,
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
        default: return $el.summernote();
      }
    },
    refresh: function (refreshOptions, refreshEvents) {
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

  if (!lemon.isFunc(events.init)) {
    events.init = function () {/**/}
  }

  lemon.each(events, function (v, k) {
    if (lemon.isFunc(v)) {
      $(tools.id).on('summernote.' + k, function(a, b, c, d) {
        if ('init' === k) {
          tools.layout = b;
        }
        return v(a, b, c, d);
      });
    }
  });

  return tools;
};

var summer = function (elId, options, events) {
  return createInstance(elId, options, events);
};

lemon.extend(summer, {
  mirror: mirror
});

module.exports = summer;
