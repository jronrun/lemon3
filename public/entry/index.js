/**
 *
 */
'use strict';

require('../css/style.styl');
var handlePageCall = {}, handleModalCall = { show: {}, shown: {}, confirm: {} }, handleTab = {};

//Bootstrap tooltips require Tether (http://github.hubspot.com/tether/)
//global.Tether = require('tether');
global.lemon = require('lemon/coffee/lemon.coffee');
lemon.register(require('lz-string'));
lemon.dec = lemon.decompressFromEncodedURIComponent;
lemon.enc = function(target) {
  if (!lemon.isString(target)) {
    target = JSON.stringify(target);
  }
  return lemon.compressToEncodedURIComponent(target);
};

require('../js/store');
require('jquery-pjax');
require('font-awesome/css/font-awesome.css');

require('Progress.js/src/progressjs.css');
var progressJs = require('Progress.js/src/progress').progressJs;

lemon.href = function (uri) {
  global.location.href = uri;
};

global.$ = $;

global.register = function(call) {
  var source = $('#page > article').attr('source');
  if (source) {
    if (!handlePageCall[source]) {
      handlePageCall[source] = call;
    }
    call();
    lemon.info('register source ' + source);
  } else {
    lemon.error('register source is not defined.');
  }
};

lemon.register({
  disableEl: function(selector) {
    return progressJs(selector).setOptions({
      theme: 'blueOverlayRadiusHalfOpacity',
      overlayMode: true
    }).start().set(0);
  },
  enableEl: function(selector) {
    progressJs(selector).end();
  },
  progress: function(options) {
    if (lemon.isString(options)) {
      options = {
        selector: options
      };
    }
    options = lemon.extend({
      selector: null,
      start: 1,
      auto: {
        ms: 100,
        step: 1
      },
      set: 0,
      cfg: {
        theme: 'blueOverlayRadiusHalfOpacity',
        overlayMode: true
      }
    }, options || {});
    var pg = progressJs(options.selector).setOptions(options.cfg).set(options.set);
    if (options.start) {
      pg.start();
    }
    if (options.auto) {
      pg.autoIncrease(options.auto.step, options.auto.ms);
    }
    return pg;
  },
  progressEnd: function(selector) {
    progressJs(selector).end();
  },

  request: function(action, data, options) {
    options = options || {};
    var req = $.ajax(lemon.extend({
      type: options.type || 'GET',
      async: true,
      url: action,
      data: data || {}
    }, options));

    return req;
  },

  put: function (action, data, options) {
    return lemon.request(action, data, lemon.extend(options || {}, {
      type: 'PUT'
    }));
  },

  delete: function (action, data, options) {
    return lemon.request(action, data, lemon.extend(options || {}, {
      type: 'DELETE'
    }));
  },

  jsonp: function (action, data, options) {
    return lemon.request(action, data, lemon.extend(options || {}, {
      type: 'GET',
      dataType: 'jsonp'
    }));
  },

  /**
   * Detect and return the current active responsive breakpoint in Bootstrap
   * http://stackoverflow.com/questions/18575582/how-to-detect-responsive-breakpoints-of-twitter-bootstrap-3-using-javascript/37141090#37141090
   * @returns {string}
   */
  detect: function () {
    var envs = ["xs", "sm", "md", "lg"];
    var env = "";

    var $el = $("<div>");
    $el.appendTo($("body"));

    for (var i = envs.length - 1; i >= 0; i--) {
      env = envs[i];
      $el.addClass("hidden-" + env + "-up");
      if ($el.is(":hidden")) {
        break; // env detected
      }
    }
    $el.remove();
    return env;
  },
  isView: function (target) {
    target = lemon.isArray(target) ? target : [target];
    return target.indexOf(lemon.detect()) != -1;
  }
});

//bootstrap
lemon.register({
  buttonTgl: function(selector) {
    $(selector).button('toggle');
    if ($(selector).hasClass('active')) {
      return true;
    }
    return false;
  },
  /**
   *
   * @param selector
   * @param options
   * {
   *  show: function(current, previous) {},   //show.bs.tab event
   *  shown: function(current, previous) {},  //shown.bs.tab event
   *  hide: function(current, soonToBeActive) {},   //hide.bs.tab event
   *  hidden: function(current, soonToBeActive) {}, //hidden.bs.tab	event
   * }
   */
  tabEvent: function(selector, options) {
    handleTab[selector] = options || {};
  },
  tabShow: function(selector) {
    $(selector).tab('show');
  }
});

lemon.onModalShow = function(bizType, call) {
  handleModalCall.show[bizType] = call;
};
lemon.onModalShown = function(bizType, call) {
  handleModalCall.shown[bizType] = call;
};
lemon.onConfirm = function(bizType, yes, no) {
  handleModalCall.confirm[bizType] = { yes: yes, no: no };
};

function doModal(handle, modalId, e) {
  var target = e.relatedTarget;
  $(modalId).data($(target).data());

  if (target.dataset && target.dataset.bizType) {
    var btype = target.dataset.bizType;
    lemon.isFunc(handle[btype]) && handle[btype](target.dataset, {
      header: $(modalId + ' .modal-header'),
      title: $(modalId + ' .modal-title'),
      body: $(modalId + ' .modal-body'),
      footer: $(modalId + ' .modal-footer')
    });
  }
}

function doConfirm(modalId, btn) {
  var dataset, confirm;
  if (dataset = $(modalId).data()) {
    if (confirm = handleModalCall.confirm[dataset.bizType]) {
      lemon.isFunc(confirm[btn]) && confirm[btn](dataset);
    }
  }
}

function doTabHandle(e, type) {
  // newly activated tab
  var cur = e.target;
  // previous active tab
  var prev = e.relatedTarget;

  var handle = handleTab['#' + $(cur).attr('id')];
  handle && lemon.isFunc(handle[type]) && handle[type](cur, prev);
}

$(function () {

  $.ajaxSetup({
    cache: false
  });

  $(document).pjax('a[data-pjax]', '#page');

  $(document).on('pjax:beforeSend', function(event, xhr, options) {
    var target = event.relatedTarget, ds = target.dataset || {};
    if (ds.query && ds.query.length) {
      var qryData = lemon.getParam(ds.query);
      if (!lemon.isBlank(qryData)) {
        xhr.setRequestHeader('query', lemon.enc(JSON.stringify(qryData)));
      }
    }
    return true;
  });

  $(document).on('pjax:end', function(event) {
    var source = $(event.target).find('article').attr('source');
    lemon.isFunc(handlePageCall[source]) && handlePageCall[source]();
  });

  var modalId = '#confirm-modal';
  if ($(modalId).length) {
    $(modalId + ' .modal-footer button').click(function () {
      doConfirm(modalId, $(this).hasClass('btn-primary') ? 'yes' : 'no');
    });

    $(modalId).on('show.bs.modal', function(e) {
      doModal(handleModalCall.show, modalId, e);
    }).on('shown.bs.modal', function(e) {
      doModal(handleModalCall.shown, modalId, e);
    });
  }

  $('a[data-toggle="tab"]').on('show.bs.tab', function (e) {
    doTabHandle(e, 'show');
  }).on('shown.bs.tab', function (e) {
    doTabHandle(e, 'shown');
  }).on('hide.bs.tab', function (e) {
    doTabHandle(e, 'hide');
  }).on('hidden.bs.tab', function (e) {
    doTabHandle(e, 'hidden');
  });

});
