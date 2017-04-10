/**
 *
 */
'use strict';

require('../css/style.styl');
//require('velocity/velocity');
//require('velocity/velocity.ui');
require('blast-text');
require('jquery-qrcode');
require('jquery-console/jquery.console');
var screenfull = require('screenfull'),
  Clipboard = require('clipboard');

var handlePageCall = {},
  handleModalCall = { show: {}, shown: {}, confirm: {} },
  handleTab = {},
  handlePjax = {};

//Bootstrap tooltips require Tether (http://github.hubspot.com/tether/)
global.Tether = require('tether');
global.lemon = require('lemon/coffee/lemon.coffee');

lemon.register({
  sift: require('sift')
});
lemon.register(require('lz-string'));
lemon.dec = lemon.decompressFromEncodedURIComponent;
lemon.enc = function(target) {
  if (!lemon.isString(target)) {
    target = JSON.stringify(target);
  }
  return lemon.compressToEncodedURIComponent(target);
};
lemon.deepDec = function(val) {
  try { val = lemon.dec(val); } catch (e) {}
  try { val = JSON.parse(val); } catch (e) {}
  return val;
};

lemon.deepCopy = function (originalTarget) {
  return $.extend(true, {}, originalTarget);
};

lemon.addDateMask({
  tiny: 'yyyymmddHHMMss'
});

lemon.data = function(selector, target) {
  var prefix = 'data-';

  //get all
  if (lemon.isUndefined(target)) {
    var $el = $(selector), r = $el.data() || {}, rdata = {};
    lemon.each(r, function(v, k) {
      rdata[k] = lemon.deepDec($el.attr(prefix + lemon.deCase(k)));
    });

    return rdata;
  }

  //get
  if (lemon.isString(target)) {
    return lemon.deepDec($(selector).attr(prefix + lemon.deCase(target)));
  } else if (lemon.isArray(target)) {
    var ar = {};
    lemon.each(target, function (tkey) {
      ar[tkey] = lemon.deepDec($(selector).attr(prefix + lemon.deCase(tkey)));
    });

    return ar;
  }

  //set
  var theData = {};
  lemon.each(target, function (v, k) {
    theData[prefix + lemon.deCase(k)] = lemon.enc(v);
  });
  $(selector).attr(theData);
};

lemon.persist = function(key, data) {
  var cur = lemon.deepDec(lemon.store(key) || {});
  if (lemon.isUndefined(data)) {
    return cur;
  }

  var v = lemon.extend({}, cur, data);
  lemon.store(key, lemon.enc(v));
  return v;
};

require('../js/store');
require('jquery-pjax');
require('font-awesome/css/font-awesome.css');

require('Progress.js/src/progressjs.css');
var progressJs = require('Progress.js/src/progress').progressJs;

lemon.href = function (uri) {
  global.location.href = uri;
};

// global.$ = global.jQuery = $;

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

function doGetValue(prop, val) {
  var original = prop, aVal = null, arrIdxFlag = false, arrIdx = function (idxStr, idxTgt) {
    var idxs = lemon.betn(idxStr, '[', ']');
    if (idxs.length > 0) {
      if ('*' === idxs[0]) {
      } else {
        var tmp = idxTgt;
        lemon.each(idxs, function(idx) {
          tmp = tmp && tmp[parseInt(idx)];
        });
        idxTgt = tmp;
      }
    }

    return idxTgt;
  };
  if (prop.indexOf('[') != -1 && prop.indexOf(']') != -1) {
    var tags = lemon.betn(prop, '[', ']', true);
    prop = prop.replace(tags.join(''), '');
    arrIdxFlag = true;
  }

  aVal = val && val[prop];
  if (lemon.isArray(aVal)) {
    aVal = arrIdx(original, aVal);
  } else if (!aVal) {
    var exp = new RegExp(prop || '.*', 'i'), newO = {}, matched = 0, matchedFirstK = null;
    lemon.each(val || {}, function (rv, rk) {
      if (exp.test(rk)) {
        newO[rk] = rv;
        if (0 == matched) {
          matchedFirstK = rk;
        }
        ++matched;
      }
    });

    if (!lemon.isBlank(newO)) {
      if (1 == matched) {
        aVal = newO[matchedFirstK];
      } else {
        aVal = newO;
      }
    }
  }

  if (lemon.isArray(aVal) && lemon.isBlank(prop) && arrIdxFlag) {
    aVal = arrIdx(original, aVal);
  }

  return aVal;
}

function values(json, prop) {
  prop = prop || '';
  var props = prop.indexOf('.') != -1 ? prop.split('.') : [prop];
  var val = json;
  lemon.each(props, function(prop) {
    if (lemon.isArray(val)) {
      var arrVals = [];
      lemon.each(val, function (arrVal) {
        arrVals.push(doGetValue(prop, arrVal));
      });
      val = arrVals;
    } else {
      val = doGetValue(prop, val);
    }
  });

  return val;
}

// value 1 asc, 0 desc
function compare(attr, value) {
  var x, y, hasAttr = !lemon.isBlank(attr), valG = function (compareObj) {
    if (lemon.isBlank(compareObj)) {
      return compareObj;
    }

    return (compareObj[attr] === null) ? '' : '' + compareObj[attr];
  };

  if (value) {
    return function (a, b) {
      x = hasAttr ? a[attr] : a, y = hasAttr ? b[attr] : b;
      if (lemon.isNumber(x) && lemon.isNumber(y)) {
        return x - y;
      }

      x = valG(a), y = valG(b);
      return x < y ? -1 : (x > y ? 1 : 0)
    }
  }
  else {
    return function (a, b) {
      x = hasAttr ? a[attr] : a, y = hasAttr ? b[attr] : b;
      if (lemon.isNumber(x) && lemon.isNumber(y)) {
        return y - x;
      }

      var x = valG(a), y = valG(b);
      return x < y ? 1 : (x > y ? -1 : 0)
    }
  }
}

var homeProgress = null;
lemon.register({
  sorts: function (anArr, prop, order) {
    if (anArr == null || !lemon.isArray(anArr)) {
      return anArr;
    }

    if (arguments.length === 1) {
      return anArr.sort();
    }

    if (lemon.isBlank(order) || 1 === order || 'asc' === order) {
      order = 1;
    } else if (0 === order || 'desc' === order) {
      order = 0;
    } else {
      order = 1;
    }

    return anArr.sort(compare(prop, order));
  },
  gets: function(json, path) {
    if (!lemon.isJson(json)) {
      return json;
    }

    return values(json, path);
  },
  queries: function (mongoStyleQry, sourceOrSelectFunc, fields) {
    var isSourceArr = false;
    if (!lemon.isJson(sourceOrSelectFunc) && !(isSourceArr = lemon.isArray(sourceOrSelectFunc))) {
      return sourceOrSelectFunc;
    }

    if (lemon.isFunc(sourceOrSelectFunc)) {

    } else if (!isSourceArr) {
      sourceOrSelectFunc = [sourceOrSelectFunc];
    }

    var theQry = {}, asRegex = function (anObj, holder) {
      lemon.each(anObj, function (v, k) {
        if (lemon.isObject(v)) {
          holder[k] = asRegex(v, {});
        } else if (lemon.isString(v)) {
          if (lemon.startWith(v, '/') && lemon.endWith(v, '/')) {
            holder[k] = new RegExp(lemon.trim(v, '/'));
          } else {
            holder[k] = v;
          }
        } else {
          holder[k] = v;
        }
      });

      return holder;
    };

    asRegex(lemon.deepCopy(mongoStyleQry || {}), theQry);

    var siftR = lemon.sift(theQry, sourceOrSelectFunc);
    if (lemon.isFunc(siftR) || lemon.isBlank(fields)) {
      if (!isSourceArr && lemon.isArray(siftR)) {
        return siftR[0];
      }

      return siftR;
    }

    if (!lemon.isArray(fields)) {
      fields = [fields];
    }

    var getV = function (aTarget, aFields) {
      var newObj = {}; lemon.each(aFields, function (field) {
        var fieldVal = null, fk = null, fas = null;
        if (field.indexOf('|') != -1) {
          var tmp = field.split('|');
          fk = tmp[0]; fas = tmp[1];
        } else {
          fk = field; fas = field;
        }

        if (fieldVal = lemon.gets(aTarget, fk)) {
          if (lemon.isBlank(fas)) {
            newObj = fieldVal;
          } else {
            newObj[fas] = fieldVal;
          }
        }
      });
      return newObj;
    };

    var qryR = [];
    lemon.each(siftR, function (item) {
      qryR.push(getV(item, fields));
    });

    if (!isSourceArr) {
      return qryR[0];
    }

    return qryR;
  },
  escape: function (target) {
    return $('<div>').text(target).html();
  },
  unescape: function (target) {
    return $('<textarea/>').html(target).text();
  },
  /**
   * Opposite of jQuery.camelCase
   * @param target
   * @returns {*}
     */
  deCase: function(target) {
    return target.replace(/[A-Z]/g, function(a) {return '-' + a.toLowerCase()});
  },
  cloneHtml: function (selector) {
    return $('<div>').append($(selector).clone()).html();
  },
  qrcode: function(selector, options) {
    if (!lemon.isString(options)) {
      options = lemon.extend({
        width: 64,
        height: 64,
        text: ''
      }, options || {});
    }
    $(selector).empty().qrcode(options);
  },
  exe: function(data) {
    return (new Function('return ' + data ))();
  },
  consoles: function(selector, options) {
    options = lemon.extend({
      executor: null,
      defines: {},
      linebreak: true,
      //type 1 success, 2 error
      clazz: function(type) {
        var lb = (options.linebreak ? ' linebreak' : '');
        switch (type) {
          case 1: return 'text-success' + lb;
          case 2: return 'text-danger' + lb;
        }
      },

      commandValidate: function (line) {
        return '' != line;
      },
      commandHandle: function (line, report) {
        try {
          var aDefine = null;
          if (lemon.isFunc(aDefine = options.defines[line])) {
            return aDefine(options.target, report, options);
          }

          var ret = lemon.isFunc(options.executor) ? options.executor(line, options.target, report) : undefined;
          return lemon.isUndefined(ret) ? true : [{ msg: ret.toString(), className: options.clazz(1)}];
        } catch (e) {
          return [{ msg: e.toString(), className: options.clazz(2)}];
        }
      },
      completeHandle: null,
      promptLabel: '> ',
      autofocus: true,
      animateScroll: true,
      promptHistory: true,
      historyPreserveColumn: true,
      welcomeMessage: ''
    }, options);

    options.defines = lemon.extend({
      clear: function (target, report) {
        target.clearScreen(); target.reset(); return true;
      },
      linebreak: function(target, report, instOptions) {
        instOptions.linebreak = !instOptions.linebreak; return 'linebreak is ' + instOptions.linebreak;
      }
    }, options.defines);

    var aConsole = $(selector).console(options);
    options.target = aConsole;
    return aConsole;
  },
  blastReset: function (selector) {
    $(selector).blast(false);
  },
  blast: function(target, selector, noneReset) {
    if (!noneReset) {
      lemon.blastReset(selector);
    }
    var blast = $(selector).blast({ search: target });
    blast.css({
      backgroundColor: "yellow",
      transition: "color 400ms"
    }); //.velocity({ backgroundColorAlpha: 1 }, { duration: 400 });
    return blast;
  },
  isUrl: function(text) {
    return /^(http|ftp|https):\/\/[\w-]+(\.[\w-]+)+([\w.,@?^=%&amp;:\/~+#-]*[\w@?^=%&amp;\/~+#-])?/.test(text);
  },
  fullUrl: function(anURI) {
    return lemon.isUrl(anURI) ? anURI : (location.origin || '') + anURI;
  },
  inlineTip: function(selector, msg, delay) {
    var tipSel = selector + ' .inlinetip';
    var isBtn = $(selector).get(0).tagName == 'BUTTON';
    if (!$(tipSel).length) {
      $(selector).append('<span class="inlinetip"></span>');
    }
    if (isBtn) {
      $(selector).attr({disabled: 'disabled'}).addClass('disabled');
    }
    $(tipSel).html(msg || ' done!');
    lemon.delay(function(){
      $(tipSel).empty();
      $(selector).removeAttr('disabled').removeClass('disabled');
    }, delay || 1500);
  },
  isDisable: function(selector) {
    return $(selector).attr('disabled');
  },
  disable: function(selector) {
    $(selector).attr({disabled: true}).addClass('disabled');
  },
  enable: function(selector) {
    $(selector).removeAttr('disabled').removeClass('disabled');
  },
  existsEl: function(selector) {
    return $(selector).length > 0;
  },
  disableEl: function(selector) {
    return progressJs(selector).setOptions({
      theme: 'blueOverlayRadiusHalfOpacity',
      overlayMode: true
    }).start().set(0);
  },
  enableEl: function(selector) {
    progressJs(selector).end();
  },
  clipboard: function (selector, options, events) {
    var opts = {}, evts = {};
    events = events || {};

    if (lemon.isFunc(options)) {
      //Dynamically set a text, you'll return a String
      opts = {
        text: function(trigger) {
          return options(trigger);
        }
      };
    } else {
      opts = options || {};
    }

    var clip = new Clipboard(selector, opts);

    if (lemon.isFunc(events)) {
      evts = { success: events };
    } else {
      evts = events || {};
    }

    /* evt.action, evt.text, evt.trigger, evt.clearSelection() */
    if (lemon.isFunc(evts.success)) {
      clip.on('success', function (evt) {
        return evts.success(evt);
      });
    }
    if (lemon.isFunc(evts.error)) {
      clip.on('error', function(evt) {
        return evts.error(evt);
      });
    }

    return clip;
  },
  disableRightclick: function(selector) {
    //forbiden right click context menu
    $(selector).on('contextmenu', function (e) {
      e.preventDefault();
      return false;
    });
  },
  rightclick: function(selector, callback) {
    lemon.live('contextmenu', selector, function (event) {
      lemon.isFunc(callback) && callback(event, selector);
      event.preventDefault();
      return false;
    });

    /*
     $(selector).contextmenu(function (e) {
     lemon.isFunc(callback) && callback(event, selector);
     e.preventDefault();
     return false;
     });
     */

    /*
     lemon.disableRightclick(selector);
     $(selector).mousedown(function (event) {
     //1 left 2 middle 3 right
     if (event.which == 3) {
     event.stopPropagation();
     event.preventDefault();
     lemon.isFunc(callback) && callback(event, selector);
     }
     });
     */
  },
  homeProgress: function() {
    return (homeProgress = progressJs().start().autoIncrease(5, 100));
  },
  homeProgressEnd: function() {
    homeProgress && homeProgress.end();
  },
  screenfull: function(callback) {
    var fullsctgl = function() {
      lemon.delay(function() {
        screenfull.toggle();
      }, 100);
    };

    $(document).on(screenfull.raw.fullscreenchange, function (event) {
      lemon.delay(function() {
        lemon.isFunc(callback) && callback(screenfull.isFullscreen, screenfull, event);
      }, 600);
    });

    fullsctgl();

    return screenfull;
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
    try {
      progressJs(selector).end();
    } catch (e) { /**/ }
  },

  request: function(action, data, options) {
    options = options || {};
    var req = $.ajax(lemon.extend({
      type: options.type || 'GET',
      async: true,
      url: action,
      data: data || {},
      headers: {}
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
      async: false,
      dataType: 'jsonp'
    }));
  },

  script: function (action, callback) {
    $.ajax({
      url: action,
      dataType: 'script',
      async: true,
      success: function (data, textStatus, jqXHR) {
        lemon.isFunc(callback) && callback(data, textStatus, jqXHR);
      }
    });
  },

  css: function(style, styleId) {
    var link = document.createElement('link');
    link.setAttribute('rel', 'stylesheet');
    link.setAttribute('type', 'text/css');
    link.setAttribute('href', style);
    if (styleId) {
      link.setAttribute('id', styleId);
    }
    lemon.query('head').appendChild(link);
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

  live: function(events, selector, handler, data) {
    if (data) {
      $(document).on(events, selector, data, function(eventObject){
        lemon.isFunc(handler) && handler(eventObject, eventObject.originalEvent.target);
      });
    } else {
      $(document).on(events, selector, function(eventObject){
        var aTarget = ((eventObject.originalEvent || {}).target) || eventObject.target;
        lemon.isFunc(handler) && handler(eventObject, aTarget);
      });
    }
  },

  /**
   * Extra small screen / phone     xs: 0,
   * Small screen / phone           sm: 544px,
   * Medium screen / tablet         md: 768px,
   * Large screen / desktop         lg: 992px,
   * Extra large screen / wide desktop    xl: 1200px
   *
   * Detect and return the current active responsive breakpoint in Bootstrap
   * http://stackoverflow.com/questions/18575582/how-to-detect-responsive-breakpoints-of-twitter-bootstrap-3-using-javascript/37141090#37141090
   * @returns {string}
   */
  detect: function () {
    var envs = ["xs", "sm", "md", "lg", "xl"];
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
  isMediumUpView: function() {
    return lemon.isView(['md','lg', 'xl']);
  },
  isSmallDownView: function() {
    return lemon.isView('xs', 'sm');
  },
  viewport: function () {
    var viewport = {
      w: $(window).width(),
      h: $(window).height(),
      smallDown: lemon.isSmallDownView(),
      mediumUp: lemon.isMediumUpView()
    };

    return viewport;
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
  },

  unload: function(callback) {
    //http://stackoverflow.com/questions/9626059/window-onbeforeunload-in-chrome-what-is-the-most-recent-fix
    $(window).on('beforeunload', function() {
      //var x =logout(); return x;
      lemon.isFunc(callback) && callback();
    });
  },

  getVal: function(json, prop) {
    prop = prop || '';
    var val = json, props = prop.indexOf('.') > 0 ? prop.split('.') : [prop];
    lemon.each(props, function(v, k) {
      var original = v;
      if (v.indexOf('[') > 0 && v.indexOf(']') > 0) {
        var tags = lemon.betn(v, '[', ']', true);
        v = v.replace(tags.join(''), '');
      }
      val = val && val[v];
      if (lemon.isArray(val)) {
        var idxs = lemon.betn(original, '[', ']');
        if (idxs.length > 0) {
          var tmp = val;
          lemon.each(idxs, function(v, k) {
            tmp = tmp && tmp[parseInt(v)];
          });
          val = tmp;
        }
      }
    });
    return val;
  },

  jsonStyl: function() {
    return lemon.data('#modals_context', 'styl');
  },

  getHighlightDoc: function(mirror, target, rightTip, css, isDecode, attrs, element) {
    var exchange = '#dd_api_exchange';
    element = element || 'pre';
    $(exchange).empty().append('<' + element +
      ' class="roundedcorner" style="background-color:#ffffff;border:0;overflow-y:scroll;"></' + element + '>');
    mirror.highlightJson5(isDecode ? target : lemon.dec(target), exchange + ' ' + element);
    $(exchange + ' ' + element).css(css || {}).prepend('<p class="pull-right text-muted">' + rightTip + '</p>');
    $(exchange + ' ' + element).attr(attrs || {});
    return $(exchange).html() + '';
  }
});

var holdMsgId = {};
//bootstrap

lemon.register({
  iframes: function(target) {
    var iframe = null;
    if (lemon.isString(target)) {
      var selector = lemon.startWith(target, '#') ? target : ('iframe[name="' + target + '"]');
      if ($(selector).length) {
        iframe = $(selector)[0];
      } else {
        var el = null;
        if (parent && (el = parent.lemon.query(selector))) {
          iframe = el;
        } else if (top && (el = top.lemon.query(selector))) {
          iframe = el;
        }
      }
    } else {
      iframe = target || window.frameElement;
    }

    var ackCalls = function(eventId, ackCallback) {
      var rootW = lemon.isRootWin() ? window : top.window, varN = '__defineIframeACKer__';
      rootW[varN] = rootW[varN] || {};
      if (lemon.isUndefined(ackCallback)) {
        return rootW[varN][eventId];
      }

      if (lemon.isNull(ackCallback)) {
        delete rootW[varN][eventId];
      } else {
        rootW[varN][eventId] = ackCallback;
      }
    };

    /**
     *
     * @param eventName
     * @param type     1 tell, 2 reply, 3 ack
     * @param data
     * @param sendFunction
     */
    var eventOn = function(eventName, type, data, sendFunction, ackCallback, eventId) {
      if (sendFunction && eventName && eventName.length > 0) {
        eventId = eventId || (type + lemon.uniqueId() + '_' + lemon.now());
        if (lemon.isFunc(ackCallback)) {
          ackCalls(eventId, ackCallback);
        }

        sendFunction({
          id: eventId,
          event: eventName,
          type: type,
          data: data || {}
        });
      }
    }, meta = {
      srcIsUrl: false,
      iframe: iframe,
      isAvailable: function() {
        return null != iframe;
      },
      getId: function() {
        return meta.attr('id');
      },
      getName: function() {
        return meta.attr('name');
      },
      attr: function(options) {
        if (lemon.isString(options)) {
          return iframe.getAttribute(options);
        }

        lemon.each(options, function(v, k) {
          if (!lemon.isNull(v)) { iframe.setAttribute(k, v); }
        });
        return meta;
      },
      fit: function(selector, offset) {
        offset = lemon.extend({
          height: 0,
          width: 0
        }, offset || {});
        meta.attr({
          width: $(selector).width() + offset.width,
          height: $(selector).height() + offset.height
        });
        return meta;
      },
      write: function(text) {
        var target = meta.getDocument();
        target.open();
        target.write(text);
        target.close();
        return meta;
      },
      openUrl: function(url, onready) {
        meta.attr({ src: url });
        meta.srcIsUrl = true;

        $('#' + meta.getId()).load(function() {
          lemon.isFunc(onready) && onready(meta);
        });

        return meta;
      },
      reload: function() {
        meta.getDocument().location.reload(true);
        return meta;
      },
      getDocument: function() {
        return iframe.contentDocument || iframe.contentWindow.document;
      },
      post: function(data, origin, sender) {
        if (data && sender) {
          try {
            data.iframe = meta.getInfo();
            sender.postMessage(lemon.enc(data), origin || '*');
          } catch (e) {
            lemon.warn(e.message, 'iframe.post');
          }
        }
      },
      /**
       * Post a message to this iframe, parent -> iFrame
       * @param data
       * @param origin
       */
      tell: function(data, origin) {
        meta.post(data, origin, iframe.contentWindow);
      },
      /**
       * Publish a message to parent from this iFrame, iFrame -> parent
       * @param data
       * @param origin
       */
      reply: function(data, origin) {
        try {
          var theRoot = iframe.contentWindow.parent,
            target = theRoot.postMessage ? theRoot : (theRoot.document.postMessage ? theRoot.document : undefined);
          meta.post(data, origin, target);
        } catch (e) { /**/ }
      },
      tellEvent: function(eventName, data, ackCallback) {
        eventOn(eventName, 1, data, meta.tell, ackCallback);
      },
      replyEvent: function(eventName, data, ackCallback) {
        eventOn(eventName, 2, data, meta.reply, ackCallback);
      },
      listen: function(callback, once, aListener) {
        if (aListener && aListener.postMessage) {
          if (lemon.isFunc(callback)) {
            var _cb = null;
            _cb = function (e) {
              if (once) {
                $(aListener).unbind('message', _cb);
              }

              var evtData = lemon.deepDec(e.originalEvent.data),
                ackFunc = ackCalls(evtData.id), ackFuncAvail = lemon.isFunc(ackFunc);

              if (3 == evtData.type) {
                ackFuncAvail && ackFunc(evtData.data || {}, evtData);
                ackCalls(evtData.id, null);
              } else if ([1, 2].indexOf(evtData.type) != -1) {
                var ackData = callback(evtData, e) || {};
                if (ackFuncAvail) {
                  //1 tell, 2 reply
                  switch (evtData.type) {
                    case 1: ackFunc = meta.reply; break;
                    case 2:
                      ackFunc = function (data, origin) {
                        var ackTell = lemon.iframes(evtData.iframe.id);
                        if (ackTell.isAvailable()) {
                          ackTell.tell(data, origin);
                        }
                      };
                    break;
                  }
                  eventOn(evtData.event, 3, ackData, ackFunc, false, evtData.id);
                }
              } else {
                callback(evtData, e);
              }
            };

            $(aListener).bind('message', _cb);
          }
        }
      },
      listenTell: function(callback, once) {
        meta.listen(callback, once, iframe.contentWindow);
      },
      listenReply: function(callback, once) {
        meta.listen(callback, once, window);
      },
      getInfo: function() {
        return {
          id: iframe.getAttribute("id"),
          name: iframe.getAttribute("name"),
          src: iframe.getAttribute('src')
        };
      },
      $: function(selector) {
        return $(selector, $('#' + meta.getId()).contents());
      }
    };

    return meta;
  },
  iframe: function(options, selector) {
    var uid = 'ifr_' + lemon.uniqueId();
    options = lemon.extend({
      id: uid,
      name: uid,
      align: null,
      allowfullscreen: null,
      frameborder: null,
      height: null,
      width: null,
      longdesc: null,
      marginheight: null,
      marginwidth: null,
      mozallowfullscreen: null,
      webkitallowfullscreen: null,
      referrerpolicy: null,
      scrolling: null,
      sandbox: null,
      seamless: null,
      src: null,
      srcdoc: null
    }, options || {});

    var iframe = document.createElement('iframe');
    var iframes = lemon.iframes(iframe);
    iframes.attr(options);
    $(selector || 'body').append(iframe);

    iframes.docInited = false;
    try {
      iframes.dom = $(window.frames[options.name].document).contents();
      iframes.doc = $(iframes.getDocument());
      iframes.docInited = true;
    } catch (e) {/**/}

    return iframes;
  },
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

    var msgId = options.msgId || ('#msg_id_' + lemon.uniqueId()),
      cid = options.containerId, isDefaultContainer = '#message' == options.containerId;
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
      if (isDefaultContainer && holdMsgId[cid].length <= 1) {
        $(options.permanentId).slideToggle();
      }
      lemon.delay(function() {
        lemon.rmByVal(holdMsgId[cid], msgId);
        $(msgId).slideToggle(function() {
          $(msgId).remove();
        });

        if (isDefaultContainer && !holdMsgId[cid].length && !$(options.permanentId + ':visible').length) {
          $(options.permanentId).slideToggle();
        }
      }, options.delay);
    } else if (options.close == 3) {

    }
    $(msgId).slideToggle();
    return msgId;
  },
  isButtonActive: function(selector) {
    if ($(selector).hasClass('active')) {
      return true;
    }
    return false;
  },
  //1 toggle, 2 active, 3 unactive
  buttonTgl: function(selector, opt) {
    opt = opt || 1;
    switch (opt) {
      case 1:
        $(selector).button('toggle');
        break;
      case 2:
        if (!lemon.isButtonActive(selector)) {
          $(selector).button('toggle');
        }
        break;
      case 3:
        if (lemon.isButtonActive(selector)) {
          $(selector).button('toggle');
        }
        break;
    }
    return lemon.isButtonActive(selector);
  },
  isClazzActive: function (selector, clazz) {
    return $(selector).hasClass(clazz);
  },
  //1 toggle, 2 active, 3 unactive
  clazzTgl: function (selector, clazz, opt, oppositeClazz) {
    opt = opt || 1;
    var actived = lemon.isClazzActive(selector, clazz), cadd = function (aClazz) {
      $(selector).addClass(aClazz);
    }, crem = function (aClazz) {
      $(selector).removeClass(aClazz);
    };

    switch (opt) {
      case 1:
        if (actived) {
          crem(clazz);
          if (oppositeClazz) {
            cadd(oppositeClazz);
          }
        } else {
          cadd(clazz);
          if (oppositeClazz) {
            crem(oppositeClazz);
          }
        }
        break;
      case 2:
        if (!actived) {
          cadd(clazz);
          if (oppositeClazz) {
            crem(oppositeClazz);
          }
        }
        break;
      case 3:
        if (actived) {
          crem(clazz);
          if (oppositeClazz) {
            cadd(oppositeClazz);
          }
        }
        break;
    }

    return lemon.isClazzActive(selector, clazz);
  },
  //opt 1 toggle, 2 mark, 3 unmark, 4 get
  attrTgl: function (selector, attrName, opt) {
    var markD = {};
    switch (opt = opt || 1) {
      case 1:
        markD[attrName] = 1 == lemon.data(selector, attrName) ? 0 : 1;
        break;
      case 2:
        if (1 != lemon.data(selector, attrName)) {
          markD[attrName] = 1;
        }
        break;
      case 3:
        if (1 == lemon.data(selector, attrName)) {
          markD[attrName] = 0;
        }
        break;
    }

    if ([1, 2, 3].indexOf(opt) != -1) {
      lemon.data(selector, markD);
    }

    return 1 == lemon.data(selector, attrName);
  },
  isEvented: function (selector) {
    return lemon.attrTgl(selector, 'evented', 4);
  },
  unEvented: function (selector) {
    return lemon.attrTgl(selector, 'evented', 3);
  },
  setEvented: function (selector) {
    return lemon.attrTgl(selector, 'evented', 2);
  },
  tmpls: function (selector, data, appendToSelector) {
    var aHtml = lemon.tmpl($(selector).html(), data || {});
    if (appendToSelector) {
      $(appendToSelector).append(aHtml);
    }
    return aHtml
  },
  /**
   * lemon.tabEventListen first
   * @param selector  tab content id
   * trigger must has property data-target='#{tab content id}' same as property href
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
  tabEventOnce: function(tabBodyId, events) {
    events = events || {};
    lemon.tabEvent(tabBodyId, {
      show: function(current, previous) {
        lemon.isFunc(events.show) && events.show(tabBodyId, current, previous);
      },
      shown: function(current, previous) {
        lemon.isFunc(events.shown) && events.shown(tabBodyId, current, previous);
      },
      hide: function(current, soonToBeActive) {
        lemon.isFunc(events.hide) && events.hide(tabBodyId, current, soonToBeActive);
      },
      hidden: function(current, soonToBeActive) {
        lemon.isFunc(events.hidden) && events.hidden(tabBodyId, current, soonToBeActive);
      }
    });
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
  },

  /**
   * @param selector    which is .dropdown class element
   * @param events
   */
  //http://stackoverflow.com/questions/21857779/process-for-using-show-bs-dropdown-in-bootstrap
  dropdownEvent: function (selector, events) {
    events = events || {};
    var onEvent = function (evtName, evt) {
      var ddEl = evt.target, ddBody = $(ddEl).find('.dropdown-menu');
      lemon.isFunc(events[evtName]) && events[evtName](ddEl, ddBody, selector, evt);
    };

    lemon.live('show.bs.dropdown', selector, function (e) {
      onEvent('show', e);
    });

    lemon.live('shown.bs.dropdown', selector, function (e) {
      onEvent('shown', e);
    });

    lemon.live('hide.bs.dropdown', selector, function (e) {
      onEvent('hide', e);
    });

    lemon.live('hidden.bs.dropdown', selector, function (e) {
      onEvent('hidden', e);
    });
  },
  /**
   * @param selector  which is .dropdown-menu class element
   */
  dropdownTgl: function (selector) {
    $(selector).dropdown('toggle');
  }
});

//http://stackoverflow.com/questions/18743144/jquery-event-listen-on-position-changed

lemon.register({
  focusSelectAll: function(selector) {
    $(selector).focus(function() {
      var $this = $(this); $this.select();

      // Work around Chrome's little problem
      $this.mouseup(function() {
        // Prevent further mouseup intervention
        $this.unbind("mouseup");
        return false;
      });
    });
  },
  enter: function(selector, options) {
    if (lemon.isFunc(options)) {
      options = {enter: options};
    }

    options = lemon.extend({
      enter: null,
      ctrlEnter: null,
      shiftEnter: null,
      preventDefault: true
    }, options || {});

    $(selector).keypress(function(event) {
      if(event.ctrlKey && event.which == 13 || event.which == 10) {
        if (options.preventDefault) {
          event.preventDefault();
        }

        lemon.isFunc(options.ctrlEnter) && options.ctrlEnter(event);
      } else if (event.shiftKey && event.which == 13 || event.which == 10) {
        if (options.preventDefault) {
          event.preventDefault();
        }

        lemon.isFunc(options.shiftEnter) && options.shiftEnter(event);
      } else if (event.keyCode == "13") {
        if (options.preventDefault) {
          event.preventDefault();
        }

        lemon.isFunc(options.enter) && options.enter(event);
      }
    });
  },
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
  alert: function (text, title, okCallback, modalEvents) {
    var okId = 'alert_id_' + lemon.uniqueId();
    var footer = [
      lemon.format('<button type="button" id="{0}" class="btn btn-primary" data-dismiss="modal">OK</button>', okId)
    ].join('');

    var body = [
      '<p class="text-info icondh"><em class="fa fa-info">&nbsp;</em></p>',
      text
    ].join('');

    modalEvents = modalEvents || {};
    var shownFunc = modalEvents.shown;
    delete modalEvents.shown;

    var mEvents = lemon.extend(modalEvents, {
      shown: function() {
        $('#' + okId).focus();
        lemon.isFunc(shownFunc) && shownFunc();
      }
    });

    lemon.modal({
      title: title || '',
      body: body,
      footer: footer,
      modal: {
        show: true
      }
    }, mEvents);

    $('#' + okId).click(function(e) {
      lemon.isFunc(okCallback) && okCallback(e);
    });
  },
  confirm: function(text, okCallback, cancelCallback, title, modalEvents) {
    var okId = 'ok_id_' + lemon.uniqueId(), cid = 'cancel_id_' + lemon.uniqueId();
    var footer = [
      lemon.format('<button type="button" id="{0}" class="btn btn-secondary borderinfo" data-dismiss="modal">Cancel</button>', cid),
      lemon.format('<button type="button" id="{0}" class="btn btn-primary" data-dismiss="modal">OK</button>', okId)
    ].join('');

    var body = [
      '<p class="text-warning icondh"><em class="fa fa-warning">&nbsp;</em></p>',
      text
    ].join('');

    modalEvents = modalEvents || {};
    var shownFunc = modalEvents.shown;
    delete modalEvents.shown;

    var mEvents = lemon.extend(modalEvents, {
      shown: function() {
        $('#' + okId).focus();
        lemon.isFunc(shownFunc) && shownFunc();
      }
    });

    lemon.modal({
      title: title || '',
      body: body,
      footer: footer,
      modal: {
        show: true
      }
    }, mEvents);

    $('#' + okId).click(function(e) {
      lemon.isFunc(okCallback) && okCallback(e);
    });

    $('#' + cid).click(function(e) {
      lemon.isFunc(cancelCallback) && cancelCallback(e);
    });
  },
  isRootWin: function(targetWin) {
    if (targetWin) {
      return window.top == targetWin;
    }
    return window.top == window.self;
  },
  /**
   * Reusable preview
   * @param text
   * @param callback
   * @param jsonOptions
   * @param domReadyCallbackIfUrl
   * @param modalOptions
     * @returns {*}
     */
  previews: function(text, callback, jsonOptions, domReadyCallbackIfUrl, modalOptions) {
    modalOptions = lemon.extend({
      contentClose: false
    }, modalOptions || {}, {
      cache: true
    });

    return lemon.preview(text, callback, jsonOptions, domReadyCallbackIfUrl, modalOptions);
  },
  /**
   * Preview in top window
   * @param text
   * @param callback                function(view, previewM) {}  view: iframe instance, previewM: modal instance
   * @param jsonOptions
   * @param domReadyCallbackIfUrl   function(view, previewM) {}  view: iframe instance, previewM: modal instance
   * @param modalOptions
   * @param modalEvents
   * @returns {*}
   */
  preview: function(text, callback, jsonOptions, domReadyCallbackIfUrl, modalOptions, modalEvents) {
    var rootW = lemon.isRootWin() ? window : top.window;
    return rootW.lemon.previewInSelfWin(text, callback, jsonOptions, domReadyCallbackIfUrl, modalOptions, modalEvents);
  },
  /**
   * Preview in current self window
   * @param text
   * @param callback                function(view, previewM) {}  view: iframe instance, previewM: modal instance
   * @param jsonOptions
   * @param domReadyCallbackIfUrl   function(view, previewM) {}  view: iframe instance, previewM: modal instance
   * @param modalOptions
   * @param modalEvents
   * @returns {*}
   */
  previewInSelfWin: function(text, callback, jsonOptions, domReadyCallbackIfUrl, modalOptions, modalEvents) {
    if (jsonOptions) {
      jsonOptions = lemon.extend({
        mirror: null,
        rightTip: '',
        css: {},
        isDecode: false,
        attrs: {},
        element: 'pre'
      }, jsonOptions || {});
      if (jsonOptions.mirror && jsonOptions.mirror.isJson(text)) {
        text = [
          lemon.jsonStyl(),
          lemon.getHighlightDoc(jsonOptions.mirror, text,
            jsonOptions.rightTip, jsonOptions.css, jsonOptions.isDecode, jsonOptions.attrs, jsonOptions.element)
        ].join('');
      }
    }

    modalOptions = lemon.extend({
      cache: false,
      contentClose: true,
      modal: {
        backdrop: false,
        keyboard: false,
        show: true
      }
    }, modalOptions || {}, {
      content: function() {
        return '<div id="' + lemon.ltrim(contextId, '#') + '"></div>';
      }
    });

    var contextId = '#preview_full_' + lemon.uniqueId();
    var previewM = lemon.modal(modalOptions, lemon.extend(modalEvents || {}, {
      shown: function(event, el) {
        var tglable = 'toggleable'; if (tglable == lemon.data(contextId, tglable)) {
          return;
        }

        var viewport = lemon.viewport();
        $(el).find('.modal-dialog').css({
          'max-height': viewport.h,
          margin: 0
        });

        var view = lemon.iframe({
          frameborder: 0
        }, contextId);

        view.attr({
          width: viewport.w,
          height: viewport.h - 6,
          style: 'background-color: white'
        });

        var pg = lemon.progress(contextId);
        if (lemon.isUrl(text)) {
          view.openUrl(text, function() {
            pg.end();
            lemon.isFunc(domReadyCallbackIfUrl) && domReadyCallbackIfUrl(view, previewM);
          });
        } else {
          text = (text || '').replace(/\\\//g, '/');
          view.write(text);
          if (view.docInited) {
            view.doc.keydown(function(e){
              //esc key
              if (27 == e.keyCode) {
                previewM.hide();
              }
            });
          }
          pg.end();
        }

        lemon.data(contextId, {toggleable: tglable});
        lemon.isFunc(callback) && callback(view, previewM);
      }
    }));

    return previewM;
  },
  modal: function(options, events) {
    var autoZIndex = 10000 + lemon.uniqueId();
    options = lemon.extend({
      id: 'a_modal_' + lemon.uniqueId(),
      content: false,
      contentClose: false,
      contentCloseTop: 0,
      title: '',
      titleClose: false,
      body: '',
      footer: '',
      modal: null,
      size: '',     //lg, sm, default is normal size
      cache: false,
      zIndex: autoZIndex
    }, options || {});

    var modalId = lemon.startIf(options.id, '#');
    if (!$(modalId).length) {
      $('#modals_context').append(lemon.tmpl($('#modal_tmpl').html(), options));

      options.modal = lemon.extend({
        backdrop: true, // doesn't close the modal on click if 'static'
        keyboard: true,
        show: false
      }, options.modal || {});

      events = events || {};
      var theModal = $(modalId).modal(options.modal)
        .on('show.bs.modal', function(e) {
          lemon.data(modalId, {shown: 1});
          lemon.isFunc(events.show) && events.show(e, this);
        })
        .on('shown.bs.modal', function(e) {
          lemon.pubEvent('MODAL', {
            show: 1,
            modalId: modalId
          });

          lemon.isFunc(events.shown) && events.shown(e, this);
        })
        .on('hide.bs.modal', function(e) {
          lemon.data(modalId, {shown: 0});
          lemon.isFunc(events.hide) && events.hide(e, this);
        })
        .on('hidden.bs.modal', function(e) {
          lemon.pubEvent('MODAL', {
            show: 0,
            modalId: modalId
          });

          if (!options.cache) {
            $(modalId).remove();
          }

          lemon.isFunc(events.hidden) && events.hidden(e, this);
        })
        .on('loaded.bs.modal', function(e) {
          lemon.isFunc(events.loaded) && events.loaded(e, this);
        });
    }

    return {
      target: theModal,
      opened: function () {
        return 1 == lemon.data(modalId, 'shown');
      },
      toggle: function() {
        $(modalId).modal('toggle');
      },
      show: function() {
        $(modalId).modal('show');
      },
      hide: function() {
        $(modalId).modal('hide');
      },
      destroy: function() {
        $(modalId).remove();
      }
    }
  },
  popover: function(selector, options, events) {
    var popoverTemplate = [
      '<div class="popover boxshadow" style="border: 0px;" role="tooltip">',
      '<div class="popover-arrow" style="border: none;"></div>',
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
    var thePopover = $(selector).popover(options = lemon.extend({
      title: '',
      trigger: 'click',
      content: '',
      template: popoverTemplate,
      placement: "bottom",
      html: true,
      arrow: true,
      shadow: true
    }, options || {}, {
      //Prevent popover content function is executed twice
      title: options.title || ('<div id="' + headId + '">&nbsp;</div>')
    })).on('inserted.bs.popover', function() {
      var el = $(this).data("bs.popover").tip;
      if (!options.shadow) {
        $(el).removeClass('boxshadow');
      }
      events.inserted && events.inserted(el, this);
    }).on('show.bs.popover', function() {
      var el = $(this).data("bs.popover").tip;
      lemon.data(selector, {shown: 1});
      lemon.isFunc(events.show) && events.show(el, this);
    }).on('shown.bs.popover', function() {
      if ($('#' + headId).length) {
        $('#' + headId).parent().hide();
      }

      var el = $(this).data("bs.popover").tip;
      if (!options.arrow) {
        $(el).find('.popover-arrow').remove();
      }

      lemon.isFunc(events.shown) && events.shown(el, this);
    }).on('hide.bs.popover', function() {
      var el = $(this).data("bs.popover").tip;
      lemon.data(selector, {shown: 0});
      lemon.isFunc(events.hide) && events.hide(el, this);
    }).on('hidden.bs.popover', function() {
      var el = $(this).data("bs.popover").tip;
      lemon.isFunc(events.hidden) && events.hidden(el, this);
    });

    return {
      target: thePopover,
      opened: function () {
        return 1 == lemon.data(selector, 'shown');
      },
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

var aFrames = lemon.iframes();
lemon.register({
  pubEvent: function(eventName, data, callback, fromIframe) {
    if (fromIframe) {
      var aFrame = lemon.iframes(fromIframe);
      if (aFrame.isAvailable()) {
        aFrame.tellEvent(eventName, data, callback);
      }
    } else {
      aFrames.replyEvent(eventName, data, callback);
    }
  },
  pubMsg: function(data) {
    if (data && !lemon.isRootWin()) {
      aFrames.reply(data);
    }
  },
  subMsg: function(callback, once) {
    aFrames.listen(callback, once, window);
  }
});

function publishUserEvent() {
  var userEvt = $('head').data('userEvent') || 'none';
  if ('none' != userEvt) {
    lemon.pubMsg(lemon.deepDec(userEvt));
  }
}

$(function () {

  lemon.previewInstance = null;

  $.ajaxSetup({
    cache: false
  });

  $(document).pjax('a[data-pjax]', '#page');

  lemon.live('click', 'a[data-preview]', function (evt) {
    evt.preventDefault();
    var href = $(evt.originalEvent.target).attr('href');
    if (! href || href.length < 1) {
      href = $(evt.originalEvent.target).parent().attr('href');
    }

    if (href && href.length > 0) {
      lemon.preview(lemon.fullUrl(href), function(theIframe, thePreview) {
        lemon.previewInstance = thePreview;
      });
    }
  });

  /**
   * <a data-pjax data-query="{{selector}}" data-queries="{{encode json data}}" href="{{href}}"> {{text}} </a>
   */
  $(document).on('pjax:beforeSend', function(event, xhr, options) {
    var target = event.relatedTarget, ds = target ? (target.dataset || {}) : {}, qryData = {};
    if (ds.query && ds.query.length) {
      lemon.extend(qryData, lemon.getParam(ds.query));
    }

    if (ds.queries && ds.queries.length) {
      lemon.extend(qryData, lemon.deepDec(ds.queries));
    }

    if (!lemon.isBlank(qryData)) {
      xhr.setRequestHeader('query', lemon.enc(JSON.stringify(qryData)));
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
  publishUserEvent();

});
