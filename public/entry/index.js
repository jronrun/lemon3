require('../css/style.styl');

//Bootstrap tooltips require Tether (http://github.hubspot.com/tether/)
Tether = require('tether');
CodeMirror = require('codemirror/lib/codemirror');
require('codemirror/lib/codemirror.css');

$(function() {
  $('#abc').text(VERSION+"hellw");
  $('#test').html('<button type="button" class="btn btn-default">Primary</button>');
});
