require('../css/style.styl');

//Bootstrap tooltips require Tether (http://github.hubspot.com/tether/)
Tether = require('tether');
CodeMirror = require('codemirror/lib/codemirror.js');

$(function() {
  $('#abc').text(VERSION+"hellw");
  $('#test').html('<button type="button" class="btn btn-default">Primary</button>');
});
