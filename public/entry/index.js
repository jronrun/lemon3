/**
 *
 */
require('../css/style.styl');

//Bootstrap tooltips require Tether (http://github.hubspot.com/tether/)
Tether = require('tether');
lemon = require('lemon/coffee/lemon.coffee');
lemon.register(require('lz-string'));
require('../js/store');
require('jquery-pjax');

$(function() { $(document).pjax('[data-pjax] a, a[data-pjax]', '#page'); });
