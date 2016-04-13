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
lemon.dec = lemon.decompressFromEncodedURIComponent;
lemon.enc = lemon.compressToEncodedURIComponent;

require('../js/store');
require('jquery-pjax');

lemon.href = function (uri) {
  global.location.href = uri;
};

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

global.rquest = function(action, data, options) {
  options = options || {};
  var req = $.ajax(lemon.extend({
    type: options.type || 'GET',
    async: true,
    url: action,
    data: data || {}
  }, options));

  return req;
};
$.put = function(action, data, options) {
  return request(action, data, lemon.extend(options || {}, {
    type: 'PUT'
  }));
};

$.delete = function(action, data, options) {
  return request(action, data, lemon.extend(options || {}, {
    type: 'DELETE'
  }));
};

$.jsonp = function(action, data, options) {
  return request(action, data, lemon.extend(options || {}, {
    type: 'GET',
    dataType: 'jsonp'
  }));
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
