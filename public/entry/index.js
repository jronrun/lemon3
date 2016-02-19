require('../css/style.styl');

//Bootstrap tooltips require Tether (http://github.hubspot.com/tether/)
Tether = require('tether');
CodeMirror = require('codemirror/lib/codemirror');
require('codemirror/lib/codemirror.css');

require('font-awesome/css/font-awesome.css');
lemon = require('lemon/coffee/lemon.coffee');
LZString = require('lz-string');
_ = require('lodash');
json5s = require('../js/json5s');

testJson = "N4KABBYGYPYwXGA5AIwIYCckBpyQO4AWAlgDYCmiALhgK7m54RUkDOiSxrYaYAOiAC2tUlWIBaUsQB25MKxoyA5jhBMwAeg1gWXMHrTT90qbLABjGIMHlpVPFsvX1hchkrID0mCzc5N2jKmck42dmqQmgBUOmz63LwopDDmANYWVmH2kZAsaFQZdjL03DBGhj6uGGDBYFEaEZCuAB6IAAzNACIAogCCnSjk5FC4kYRopFCIAHQArKOQACbkomiIANQAjG0LzAhgAJLSUDLEVACe2JBaPNKLYIPnZYsAhI0QJ9ITpOccvDRoMjKDLWNCqSIwQiIADa6kiACJ8HJWIQYCJFtIkAVYBglOQqPDdjkkJgMGhztxzIYwOMAG7kcE5CBYslA6RKEGCNDcKhwRkQAC6uAAviAgA";
testJson2 = "PTAEBUAsEsGdQGbQDYFNR1AdwE7QC76oB2GpAUgMoDyAcgKyiwCex+AhgB4A0ox7+AK452yZM14AjQfj4AHALZ9UqACbx2oHKgDmg5OxwAoEKCp1EKVL1gB7UAGNbCuVdAA3aJoAGxRVsFSaRRVbwA6UAAhdFhhdHx7AGsVOVBJW3xIMiZWBwBCIyMAbyNQMr52BVQALlAAcgArO2J6Ou5S8vdUHFhoW2JauoAGMIAWMKG2jrLVVFgHPDl8PoH681pEWxxQTPQAUUpGbvYwqfLQZOYsLfVagG1G5rb6udaAXXbz9hlILcGAQVgKiUAGk4L9tKAADzsIGoBRhRLgraoAACOgU7BQYScCgAfGdyk42HhpAkevdpudQKZwNQACLUWqUX76VTYdDaBS2Lo7GDwIEOZb9bIIdjuLagWwIUAAcQIAAlBJI6vBkHB8AB+KnnUyQQhyWDVEA6AiQZU45zAWHAxLAJr9ejAYn4UkyLawHXlOoAWS4oFo7H4LGhmM4YX4weY6Mx2NxBM+1LKdX+xFU2iwoD2cBIkm6OmhQfTqCwqNQOeIeZwOjCsITXuT5BuQYgggcyW2UIazcrQnb3RjWOQlvxhLKHypsdWdXVkntzXoYSaY7S0Gns+d6qXsBXszkJFmxAc0DmtSKAF9EzNUO56ah92mSMfT6ASkmytyHJB2IMAH4ARgmMIAGZnnKWkGSZUAABlbFsRIyASUAfVsL9NHcAAmMIqUvKl5kWfAjVfBs0kEEJBjCYANwcLcmlAABaBxQDkdh23YHRUG3R0V3OIhYHwQZP2/Bj6LI0BUE4OQtkIkTtCknAiG2WB9wcHj3wgxlagAdVsNkMFkPM0lQQhuh2exZiQYh4kgOZ0DXUBNCEk5bCWeAkDQbVzlw85fiqFiOMGfV8DkY150dMIth0YAV3VBwSCBQYfQASXAFc5NsXpyWYM8SPwZh90GU18DUsphGQQKDSNE0zQtXFrThBQ7QdFowiKldcPPIA===";

$(function() {
  lemon.console();
  $('#abc').text(VERSION+"hell");
  $('#test').html('<button type="button" class="btn btn-default">Primary</button>');
  $('#textarea').text(LZString.decompressFromBase64(testJson2));

  $('#j5format').click(function () {
    $('#textarea2').val(json5s.format($('#textarea').val()));
  });

});
