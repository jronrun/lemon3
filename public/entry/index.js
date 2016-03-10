require('../css/style.styl');

//Bootstrap tooltips require Tether (http://github.hubspot.com/tether/)
Tether = require('tether');
lemon = require('lemon/coffee/lemon.coffee');
lemon.register(require('lz-string'));


// modular
require('font-awesome/css/font-awesome.css');

$(function () {

  var themeSettings = (localStorage.getItem('themeSettings')) ? JSON.parse(localStorage.getItem('themeSettings')) :
  {};
  var themeName = themeSettings.themeName || '';
  if (themeName)
  {
    require('../css/app-' + themeName + '.scss');
  }
  else
  {
    require('../css/app.scss');
  }

});
