/**
 *
 */
'use strict';

require('../css/style.styl');
var handlePageCall = {};

//Bootstrap tooltips require Tether (http://github.hubspot.com/tether/)
//global.Tether = require('tether');
global.lemon = require('lemon/coffee/lemon.coffee');
lemon.register(require('lz-string'));
lemon.decode = lemon.decompressFromEncodedURIComponent;

require('../js/store');
require('jquery-pjax');

//global.$ = $;

global.register = function(call) {
  var source = $('#page > article').attr('source');
  if (source) {
    handlePageCall[source] = call; call();
    lemon.info('register source ' + source);
  } else {
    lemon.error('register source is not defined.');
  }
};

$(function () {

  $.ajaxSetup({
    cache: false
  });

  $(document).pjax('a[data-pjax]', '#page');

  $(document).on('pjax:end', function(event) {
    var source = $(event.target).find('article').attr('source');
    lemon.isFunc(handlePageCall[source]) && handlePageCall[source]();
  });

});
