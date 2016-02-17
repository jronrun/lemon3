require('../css/style.styl');

//Bootstrap tooltips require Tether (http://github.hubspot.com/tether/)
Tether = require('tether');
CodeMirror = require('codemirror/lib/codemirror');
require('codemirror/lib/codemirror.css');
require('font-awesome/css/font-awesome.css');
JSON5 = require('json5');
lemon = require('lemon/coffee/lemon.coffee');
jju = require('jju/lib/parse');
LZString = require('lz-string');

testJson = "N4KABBYGYPYwXGA5AIwIYCckBpyQO4AWAlgDYCmiALhgK7m54RUkDOiSxrYaYAOiAC2tUlWIBaUsQB25MKxoyA5jhBMwAeg1gWXMHrTT90qbLABjGIMHlpVPFsvX1hchkrID0mCzc5N2jKmck42dmqQmgBUOmz63LwopDDmANYWVmH2kZAsaFQZdjL03DBGhj6uGGDBYFEaEZCuAB6IAAzNACIAogCCnSjk5FC4kYRopFCIAHQArKOQACbkomiIANQAjG0LzAhgAJLSUDLEVACe2JBaPNKLYIPnZYsAhI0QJ9ITpOccvDRoMjKDLWNCqSIwQiIADa6kiACJ8HJWIQYCJFtIkAVYBglOQqPDdjkkJgMGhztxzIYwOMAG7kcE5CBYslA6RKEGCNDcKhwRkQAC6uAAviAgA";

$(function() {
  $('#abc').text(VERSION+"hell");
  $('#test').html('<button type="button" class="btn btn-default">Primary</button>');
  $('#json5').text(testJson);
});
