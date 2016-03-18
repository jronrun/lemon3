/**
 *
 */
'use strict';

require('../css/style.styl');

//Bootstrap tooltips require Tether (http://github.hubspot.com/tether/)
global.Tether = require('tether');
global.lemon = require('lemon/coffee/lemon.coffee');
lemon.register(require('lz-string'));
require('../js/store');
require('jquery-pjax');

$(function() { $(document).pjax('a[data-pjax]', '#page'); });
