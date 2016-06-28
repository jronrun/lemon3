/**
 *
 */
'use strict';

require('../css/style.styl');
var handlePageCall = {},
  handleModalCall = { show: {}, shown: {}, confirm: {} },
  handleTab = {},
  handlePjax = {};

//Bootstrap tooltips require Tether (http://github.hubspot.com/tether/)
global.Tether = require('tether');
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

var initlock = {};
function callinit(source) {
  source = source + '';
  if (!initlock[source]) {
    initlock[source] = 1;
    lemon.delay(function () {
      $(function () {
        lemon.isFunc(handlePageCall[source]) && handlePageCall[source]();
        delete initlock[source];
      });
    }, 500);
  }
}

global.register = function(call) {
  var source = $('#page > article').attr('source');
  if (source) {
    if (!handlePageCall[source]) {
      handlePageCall[source] = call;
    }
    callinit(source);
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

  pjax: function(url, container) {
    $.pjax({url: url, container: container || '#page'});
  },

  pjaxReload: function(container) {
    lemon.pjax(lemon.getURI(), container);
  },

  /**
   *
   * @param url
   * @param callback  function(event, xhr, options) {}
   * @param once    is call once, 1 true 0 false
     */
  pjaxBeforeSend: function(url, callback, once) {
    lemon.pjaxEvent(url, {
      once: once || 0,
      beforeSend: callback
    })
  },

  /**
   *
   * @param callId
   * @param options {
   * beforeSend: function(event, xhr, options) {}
   * end: function(event) {}
   * }
   */
  pjaxEvent: function(url, options) {
    handlePjax[url] = options || {};
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
  },

  hasEvent: function(selector, type) {
    var data = undefined;

    try {
      data = ($._data($(selector)[0], 'events') || {})[type];
    } catch (e) {

    }

    if (data === undefined || data.length === 0) {
      return false;
    }

    return true;
  },

  getURI: function() {
    return location.href.replace(location.origin, '');
  }
});

var holdMsgId = {};
//bootstrap
lemon.register({
  msg: function(text, options) {
    options = lemon.extend({
      msgId: '',
      level: 'warning',
      delay: 5000,
      //1 auto: disappear when options.delay millesecond, 2 manual: manual close, 3 forever
      close: 1,
      containerId: '#message',
      permanentId: '#permanent_id'
    }, options || {});

    var msgId = options.msgId || ('#msg_id_' + lemon.uniqueId()), cid = options.containerId;
    var msg = $(document.createElement('div')).attr({
      class: 'alert alert-' + options.level,
      role: 'alert',
      id: lemon.ltrim(msgId, '#'),
      style: 'display:none'
    }).html(text);

    $(cid).append(msg);
    holdMsgId[cid] = holdMsgId[cid] || [];
    holdMsgId[cid].push(msgId);

    if (options.close == 2) {
      msg.append([
        '<button type="button" class="close" data-dismiss="alert" aria-label="Close">',
        '<span aria-hidden="true">&times;</span></button>'
      ].join(''));
    } else if (options.close == 1) {
      if (holdMsgId[cid].length <= 1) {
        $(options.permanentId).slideToggle();
      }
      lemon.delay(function() {
        lemon.rmByVal(holdMsgId[cid], msgId);
        $(msgId).slideToggle(function() {
          $(msgId).remove();
        });

        if (!holdMsgId[cid].length && !$(options.permanentId + ':visible').length) {
          $(options.permanentId).slideToggle();
        }
      }, options.delay);
    } else if (options.close == 3) {

    }
    $(msgId).slideToggle();
    return msgId;
  },
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
  },
  tabEventListen: function() {
    $('a[data-toggle="tab"]').on('show.bs.tab', function (e) {
      doTabHandle(e, 'show');
    }).on('shown.bs.tab', function (e) {
      doTabHandle(e, 'shown');
    }).on('hide.bs.tab', function (e) {
      doTabHandle(e, 'hide');
    }).on('hidden.bs.tab', function (e) {
      doTabHandle(e, 'hidden');
    });
  }
});

lemon.register({
  scroll: function(selector, handle) {
    var prevContentH = 0;
    lemon.scrollNext = false;
    $(selector).scroll(function(){
      var $this = $(this), viewH = $this.height(),
        contentH = $this.get(0).scrollHeight, scrollTop = $this.scrollTop();
      //when reach bottom 100px, if(contentH - viewH - scrollTop <= 100)
      if ('0' == ($(selector).data('lock') || '0')) {
        if(lemon.scrollNext || ((prevContentH != contentH) && (scrollTop / (contentH - viewH) >= 0.95))){
          $(selector).data('lock', '1');
          lemon.scrollNext = false;
          prevContentH = contentH;
          lemon.isFunc(handle) && handle();
          $(selector).data('lock', '0');
        }
      }
    });
  },
  popover: function(selector, options, events) {
    var popoverTemplate = [
      '<div class="popover" role="tooltip">',
      '<div class="popover-arrow"></div>',
      '<h3 class="popover-title"></h3>',
      '<div class="popover-content"></div>',
      '</div>'
    ].join('');

    if (lemon.isString(options) || lemon.isFunc(options)) {
      options = { content: options };
    }

    var headId = 'prevent_twice' + lemon.uniqueId();
    events = events || {};
    options = options || {title: null};
    var thePopover = $(selector).popover(lemon.extend({
      title: '',
      trigger: 'click',
      content: '',
      template: popoverTemplate,
      placement: "bottom",
      html: true
    }, options || {}, {
      //Prevent popover content function is executed twice
      title: options.title || ('<div id="' + headId + '">&nbsp;</div>')
    })).on('inserted.bs.popover', function() {
      var el = $(this).data("bs.popover").tip;
      events.inserted && events.inserted(el, this);
    }).on('show.bs.popover', function() {
      var el = $(this).data("bs.popover").tip;
      lemon.isFunc(events.show) && events.show(el, this);
    }).on('shown.bs.popover', function() {
      if (lemon.isBlank(options.title)) {
        $('#' + headId).parent().hide();
      }

      var el = $(this).data("bs.popover").tip;
      lemon.isFunc(events.shown) && events.shown(el, this);
    }).on('hide.bs.popover', function() {
      var el = $(this).data("bs.popover").tip;
      lemon.isFunc(events.hide) && events.hide(el, this);
    }).on('hidden.bs.popover', function() {
      var el = $(this).data("bs.popover").tip;
      lemon.isFunc(events.hidden) && events.hidden(el, this);
    });

    return {
      target: thePopover,
      show: function() {
        $(selector).popover('show');
      },
      hide: function() {
        $(selector).popover('hide');
      },
      toggle: function() {
        $(selector).popover('toggle');
      },
      dispose: function() {
        $(selector).popover('dispose');
      }
    };
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

  var handle = handleTab[$(cur).data('target')];
  handle && lemon.isFunc(handle[type]) && handle[type](cur, prev);
}

$(function () {

  $.ajaxSetup({
    cache: false
  });

  $(document).pjax('a[data-pjax]', '#page');

  $(document).on('pjax:beforeSend', function(event, xhr, options) {
    var target = event.relatedTarget, ds = target ? (target.dataset || {}) : {};
    if (ds.query && ds.query.length) {
      var qryData = lemon.getParam(ds.query);
      if (!lemon.isBlank(qryData)) {
        xhr.setRequestHeader('query', lemon.enc(JSON.stringify(qryData)));
      }
    }

    var origin = location.origin;
    xhr.setRequestHeader('Referer-Source', location.href.replace(origin, ''));

    if (options && options.url) {
      var theURL = options.url.replace(origin, '');
      theURL = theURL.substr(0, theURL.indexOf('?'));
      var registerOptions = handlePjax[theURL] || {};

      if (lemon.isFunc(registerOptions.beforeSend)) {
        registerOptions.beforeSend(event, xhr, options);
        if (1 == registerOptions.once) {
          delete handlePjax[theURL]
        }
      }
    }

    return true;
  });

  $(document).on('pjax:end', function(event) {
    var source = $(event.target).find('article').attr('source');
    //lemon.isFunc(handlePageCall[source]) && handlePageCall[source]();
    callinit(source);
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

  lemon.tabEventListen();

});
