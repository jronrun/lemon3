/**
 *
 */
var mirror = require('../js/codemirror');
require('bootstrap/js/dist/tooltip');
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
  ]
};

var helper = function (elId, events) {
  events = events || {};
  var tools = {
    id: elId,
    layout: null,
    ui: $.summernote.ui,

    mirror: function () {
      if (null == tools.layout || !tools.layout.codable) {
        return null;
      }

      var inst = $(tools.layout.codable).data('cmEditor');
      if (!inst) {
        return null;
      }

      return mirror.helpers(inst);
    }
  };

  lemon.each(theAPIs, function (v, k) {
    lemon.each(v, function (n) {
      tools[n] = function () {
        var len = arguments.length, arg = arguments, $el = $(tools.id);
        switch (len) {
          case 1: return $el.summernote(n, arg[0]);
          case 2: return $el.summernote(n, arg[0], arg[1]);
          case 3: return $el.summernote(n, arg[0], arg[1], arg[2]);
          case 4: return $el.summernote(n, arg[0], arg[1], arg[2], arg[3]);
          case 5: return $el.summernote(n, arg[0], arg[1], arg[2], arg[3], arg[4]);
          default: return $el.summernote(n);
        }
      };
    });
  });

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
  }, options || {});

  delete options.callbacks;
  var inst = helper(elId, events);

  $(elId).summernote(options);
  return inst;
};

lemon.extend(summer, {
  mirror: mirror
});

module.exports = summer;
