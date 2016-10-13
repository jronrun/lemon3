/**
 *
 */
require('bootstrap/js/dist/tooltip');
require('imports?require=>false,define=>false,module=>false!summernote');
var mirror = require('../js/codemirror');

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

var helper = function (elId) {

  var tools = {
    id: elId,
    ui: $.summernote.ui,
  };

  lemon.each(theAPIs, function (v, k) {
    lemon.each(v, function (n) {
      tools[n] = function () {
        var len = arguments.length, arg = arguments;
        switch (len) {
          case 1: return $(tools.id).summernote(n, arg[0]);
          case 2: return $(tools.id).summernote(n, arg[0], arg[1]);
          case 3: return $(tools.id).summernote(n, arg[0], arg[1], arg[2]);
          case 4: return $(tools.id).summernote(n, arg[0], arg[1], arg[2], arg[3]);
          case 5: return $(tools.id).summernote(n, arg[0], arg[1], arg[2], arg[3], arg[4]);
          default: return $(tools.id).summernote(n);
        }
      };
    });
  });

  return tools;
};

var summer = function (elId, options) {
  options = lemon.extend({
    onInit: function () {

    }
  }, options || {});

  $(elId).summernote(options);
  return helper(elId);
};

lemon.extend(summer, {
  mirror: mirror
});

module.exports = summer;
