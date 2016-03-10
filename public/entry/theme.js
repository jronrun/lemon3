require('font-awesome/css/font-awesome.css');

$(function() {

  var settings = lemon.store('settings') || {},
    theme = settings.theme ? ('app-' + settings.theme) : 'app';
  require('../css/' + theme + '.scss');

});
