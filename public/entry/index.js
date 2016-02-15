require('../css/style.styl');

//Bootstrap tooltips require Tether (http://github.hubspot.com/tether/)
Tether = require('tether');
CodeMirror = require('codemirror/lib/codemirror');
require('codemirror/lib/codemirror.css');
require('font-awesome/css/font-awesome.css');
JSON5 = require('json5/lib/json5');
lemon = require('lemon/coffee/lemon.coffee');

$(function() {
  $('#abc').text(VERSION+"hellw");
  $('#test').html('<button type="button" class="btn btn-default">Primary</button>');
});
