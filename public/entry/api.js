/**
 *
 */
var mirror = require('../js/codemirror');

var _current = {};
function current(data) {
  //data { env: null, serv: null, envGroup: null, apiGroup: null, api: null }
  lemon.extend(_current, data || {});
  return _current;
}

function leave(){
  lemon.persist('api_snapshoot', mapi.snapshoot());
}

var apis = {
  id: '#api_dd',
  groupHead: {
    id: function(groupId) {
      return '#api_group_' + groupId;
    },
    render: function(groupInfo) {
      return lemon.tmpl($('#dd_api_group_tmpl').html(), groupInfo);
    }
  },

  apiHead: {
    id: function(apiId) {
      return '#interf_' + apiId;
    },

    render: function(groupInfo, apiInfo) {
      return lemon.tmpl($('#dd_api_tmpl').html(), lemon.extend({}, apiInfo, {
        group: groupInfo
      }));
    }
  },

  getHighlightDoc: function(encodeDoc, rightTip, css) {
    var exchange = '#dd_api_exchange';
    mirror.highlightJson5(lemon.dec(encodeDoc), exchange + ' pre');
    $(exchange + ' pre').css(css || {}).prepend('<p class="pull-right text-muted">' + rightTip + '</p>');
    return $(exchange).html() + '';
  },

  refresh: function(groupId, apiId) {
    $(lemon.format('blockquote[apig]', groupId)).css('background-color', 'white');
    $(lemon.format('blockquote[apig="{0}"]', groupId)).css('background-color', 'ghostwhite');

    if (apiId) {
      $('#_api_check').remove();
      $(apis.apiHead.id(apiId) + ' .m-b-0')
        .prepend('<em id="_api_check" class="fa fa-check text-success">&nbsp;&nbsp;</em>');
    }
  },

  choose: function(apiId) {
    var elId = apis.apiHead.id(apiId);
    if (!$(elId).length) {
      return;
    }
    var data = {
      apiGroup: lemon.data(elId, 'group'),
      api: lemon.data(elId, 'api')
    };

    current(data);
    apis.doChoose(data.apiGroup, data.api);
  },

  doChoose: function(group, api) {
    if (!lemon.isBlank(api.request || {})) {
      mapi.requ.json(api.request);
    }
    if (!lemon.isBlank(api.response || {})) {
      if (lemon.has(api, 'json') && api.json) {
        mapi.resp.json(api.response);
      } else {
        mapi.resp.val(lemon.dec(api.response));
      }
    }

    if (group.id) {
      envs.refresh(group.id);
      if (api.id) {
        apis.refresh(group.id, api.id);
      }
    }
  },

  render: function(page, callback) {
    var viewport = {
      w: $(window).width(),
      h: $(window).height()
    };

    page = page || 1;
    $(apis.id).data('page', page);

    $.post('/api/interfaces', {
      page: page
    }, function (resp) {
      if (0 == resp.code) {
        if (resp.result.items.length > 0 && 1 == page) {
          if (lemon.isSmallDownView()) {
            $(apis.id).css({
              height: viewport.h * 0.7,
              'max-height': viewport.h * 0.7,
              'overflow-y': 'scroll',
              width: viewport.w * 0.8
            });
          } else {
            $(apis.id).css({
              height: viewport.h * 0.8,
              'max-height': viewport.h * 0.8,
              'overflow-y': 'scroll',
              width: viewport.w * 0.25
            });
          }
        }

        _.each(resp.result.items, function (group) {
          var apiGroupElId = apis.groupHead.id(group.info.id);
          if (!$(apiGroupElId).length) {
            $(apis.id).append(apis.groupHead.render(group.info));
          }

          _.each(group.interfs, function (interf) {
            var apiElId = apis.apiHead.id(interf.id);
            if (!$(apiElId).length) {
              $(apiGroupElId).append(apis.apiHead.render(group.info, interf));
              lemon.data(apiElId, {
                group: group.info,
                api: interf
              });

              $(apiElId).click(function () {
                apis.choose(interf.id);
              });
              if (lemon.isSmallDownView()) {

              } else {
                var title = [
                  '<span class="font-weight-bold">',
                  interf.name,
                  '</span><span class="label label-info pull-right">',
                  group.info.name,
                  '</span>'
                ].join('');
                lemon.popover(apiElId, {
                  title: title,
                  trigger: 'hover',
                  placement: 'right',
                  content: function() {
                    return apis.getHighlightDoc(interf.request_doc, 'Request', {
                      'max-height': viewport.h * 0.9
                    });
                  }
                }, {
                  show: function(el, target) {
                    $(el).css({
                      width: viewport.w * 0.5,
                      'max-width': viewport.w * 0.5,
                      'max-height': viewport.h
                    }).addClass('borderinfo');
                  }
                });
              }
            }
          });
        });

        if (1 == page) {
          lemon.scroll(apis.id, function () {
            var pg = lemon.progress(apis.id + 't');
            var pn = parseInt($(apis.id).data('page')) + 1;
            apis.render(pn, function() {
              pg.end();
              var choosed = current();
              if (choosed.apiGroup && choosed.api) {
                apis.refresh(choosed.apiGroup.id, choosed.api.id);
              }
            });
          });
        }
      } else {
        lemon.msg(resp.msg);
      }

      lemon.isFunc(callback) && callback();
    });
  }

};

var envs = {
  id: '#env_dd',
  envHead: {
    id: function(envId) {
      return '#envh_' + envId;
    },
    render: function(envInfo) {
      return lemon.tmpl($('#dd_env_tmpl').html(), envInfo);
    }
  },
  groupHead: {
    id: function(envId, groupId) {
      return '#grouph_' + envId + '_' + groupId;
    },
    render: function(envInfo, groupInfo) {
      return lemon.tmpl($('#dd_env_group_tmpl').html(), lemon.extend({}, groupInfo, {
        env: envInfo
      }));
    }
  },

  servHead: {
    id: function(servId) {
      return '#server_' + servId;
    },
    render: function(envInfo, groupInfo, servInfo) {
      return lemon.tmpl($('#dd_server_tmpl').html(), lemon.extend({}, servInfo, {
        env: envInfo,
        group: groupInfo
      }));
    }
  },

  msg: function(msg, level) {
    $('#permanent_id')
      .prop('class', '')
      .prop('class', 'alert alert-' + level)
      .html(msg || '&nbsp;');
  },

  refresh: function(groupId, servId) {
    $('div[id^="grouph_"]').css('background-color', 'white');
    $(lemon.format('div[envg="{0}"]', groupId)).css('background-color', 'ghostwhite');

    if (servId) {
      $('#_env_check').remove();
      $(envs.servHead.id(servId))
        .prepend('<em id="_env_check" class="fa fa-check text-success">&nbsp;&nbsp;</em>');
    }
  },

  isDanger: function() {
    var choosed = current();
    if (choosed.env) {
      return 'danger' == choosed.env.level;
    }

    return false;
  },

  choose: function(servId) {
    var elId = envs.servHead.id(servId);
    if (!$(elId).length) {
      return;
    }
    var data = {
      env: lemon.data(elId, 'env'),
      envGroup: lemon.data(elId, 'group'),
      serv: lemon.data(elId, 'serv')
    };

    current(data);
    envs.doChoose(data.env, data.envGroup, data.serv);
  },

  doChoose: function(env, group, serv) {
    var servMsg = [
      env.name,
      group.name,
      '-',
      serv.name
    ];

    if ('danger' == env.level) {
      servMsg.push('&nbsp;&nbsp;&nbsp;<strong>Danger !!!</strong>');
    }

    envs.msg(servMsg.join('&nbsp;&nbsp;'), env.level);
    apis.refresh(group.id);
    envs.refresh(group.id, serv.id);
  },

  render: function(page, callback) {
    var viewport = {
      w: $(window).width(),
      h: $(window).height()
    };

    page = page || 1;
    $(envs.id).data('page', page);

    $.post('/api/servers', {
      page: page
    }, function (resp) {
      if (0 == resp.code) {
        if (resp.result.envs.length > 0 && 1 == page) {
          $(envs.id).css({
              height: viewport.h * 0.8,
              'max-height': viewport.h * 0.8,
              'overflow-y': 'scroll'
          });

          if (lemon.isSmallDownView()) {
            $(envs.id).css({
              width: viewport.w * 0.8
            });
          } else {
            $(envs.id).css({
              width: viewport.w * 0.25
            });
          }
        }

        _.each(resp.result.envs, function (env) {
          var envElId = envs.envHead.id(env.info.id);
          if (!$(envElId).length) {
            $(envs.id).append(envs.envHead.render(env.info));
          }

          _.each(env.groups, function (group) {
            var groupElId = envs.groupHead.id(env.info.id, group.info.id);
            if (!$(groupElId).length) {
              $(envElId).append(envs.groupHead.render(env.info, group.info));
            }

            _.each(group.servs, function (serv) {
              var servElId = envs.servHead.id(serv.id);
              if (!$(servElId).length) {
                $(groupElId).append(envs.servHead.render(env.info, group.info, serv));
              }
              lemon.data(servElId, {
                env: env.info,
                group: group.info,
                serv: serv
              });

              $(servElId).click(function() {
                envs.choose(serv.id);
              });
            });
          });
        });

        if (1 == page) {
          lemon.scroll(envs.id, function () {
            var pg = lemon.progress(envs.id + 't');
            var pn = parseInt($(envs.id).data('page')) + 1;
            envs.render(pn, function() {
              pg.end();
              var choosed = current();
              if (choosed.envGroup && choosed.serv) {
                envs.refresh(choosed.envGroup.id, choosed.serv.id);
              }
            });
          });
        }

      } else {
        lemon.msg(resp.msg);
      }

      lemon.isFunc(callback) && callback();
    });
  }

};

var requs = {
  id: '#api_request',

  init: function() {
    $(requs.id).click(function () {
      var choosed = current();
      if (!choosed.env || !choosed.envGroup || !choosed.serv) {
        return lemon.msg('Please choose an Environment first.');
      }

      //chosen API
      if (choosed.apiGroup && choosed.api) {
        if (choosed.envGroup.id != choosed.apiGroup.id) {
          var tip = 'The chosen {0} server {1} does not support the {2} {3}';
          return lemon.msg(lemon.format(tip, choosed.envGroup.name, choosed.serv.name, choosed.apiGroup.name, choosed.api.name));
        }
      }
      //unchosen API
      else {

      }

      if (!mapi.requ.isJson()) {
        return lemon.msg('The Request Data is not a Valid JSON or JSON5.');
      }

      if (lemon.isDisable(requs.id)) {
        return;
      }

      lemon.disable(requs.id);
      var startRequ = function () {
        var pg = lemon.progress(mapi.navbarId);
        requs.request(function() {
          lemon.enable(requs.id);
          pg.end();
        });
      };

      if (envs.isDanger()) {
        var env = choosed.env,
          tip = '<h5>Are you sure ?</h5> <span class="text-warning">{0} !!!</span>';
        lemon.confirm(lemon.format(tip, env.desc || env.name) , startRequ, function() {
          lemon.enable(requs.id);
        });
      } else {
        startRequ();
      }
    });
  },

  request: function(callback) {
    var choosed = current(), data = {
      env: choosed.env.id,
      group: choosed.envGroup.id,
      serv: choosed.serv.id,
      api: choosed.api ? choosed.api.id : -1,
      requ: lemon.enc(mapi.requ.json())
    };

    $.post('/api/request', data).done(function (resp) {
      if (401 == resp.code) {
        lemon.isFunc(callback) && callback();
      } else if (0 == resp.code) {
        var rdata = lemon.deepDec(resp.result);
        lemon.jsonp(rdata.path, rdata.data).done(function (data, textStatus, jqXHR) {
          lemon.info(textStatus, 'request status');
          lemon.info(data, 'response');
          if (lemon.isString(data)) {
            mapi.resp.val(data);
          } else {
            mapi.resp.json(data);
          }

          lemon.isFunc(callback) && callback();

          $.post('/api/history', {
            hisId: rdata.hisId,
            resp: lemon.enc(data)
          }).done(function (resp) {
            lemon.info(resp);
          });
        }).fail(function(jqXHR, textStatus, errorThrown){
          lemon.error(jqXHR);
          lemon.error(textStatus, 'request status');
          lemon.error(errorThrown);

          mapi.resp.json({
            title: 'Request Failed (JSONP)',
            cause: 'See browser console for more information',
            jqXHR: jqXHR,
            textStatus: textStatus,
            errorThrown: errorThrown
          });

          lemon.isFunc(callback) && callback();
        });
      } else if (2 == resp.code) {


        lemon.isFunc(callback) && callback();
      } else {
        lemon.msg(resp.msg);

        lemon.isFunc(callback) && callback();
      }
    });
  }
};

var history = {
  cur: -1,
  prevId: '#history_prev',
  nextId: '#history_next',

  next: function(callback, isPrev) {
    var tip = isPrev ? 'previous' : 'next',
      action = isPrev ? '/api/history/prev' : '/api/history/next';
    $.post(action, {
      curHis: history.cur
    }).done(function (resp) {
      if (0 == resp.code) {
        var rdata = lemon.deepDec(resp.result);
        if (!rdata.item) {
          lemon.msg('There is no ' + tip +' history.')
        } else {
          history.cur = rdata.item.id;
          envs.doChoose(rdata.item.env, rdata.item.group, rdata.item.serv);
          mapi.setCur(rdata.item.env, rdata.item.serv, rdata.item.group);
          apis.doChoose(rdata.item.group, rdata.item.api);
          mapi.setCur(null, null, null, rdata.item.group, rdata.item.api);
        }
        lemon.isFunc(callback) && callback();
      } else {
        lemon.msg(resp.msg);
        lemon.isFunc(callback) && callback();
      }
    });
  },
  prev: function(callback) {
    history.next(callback, true);
  },

  init: function() {
    $(history.nextId).click(function () {
      var pg = lemon.progress(mapi.respToolId);
      history.next(function () {
        pg.end();
      });
    });

    $(history.prevId).click(function () {
      var pg = lemon.progress(mapi.respToolId);
      history.prev(function () {
        pg.end();
      });
    });
  }
};

var qry = {
  inputId: '#input_search',
  searchId: '#do_search',

  init: function() {
    lemon.enter(qry.inputId, function() {

    });
  }
};

var mapi = {
  navbarId: '#navbar-layout',
  gridId: '#grid-layout',

  requToolId: '#requ-tool',
  requCardId: '#requ-card',

  respToolId: '#resp-tool',
  respCardId: '#resp-card',

  requ: null,
  resp: null,
  setCur: function(env, serv, envGroup, apiGroup, api) {
    var cur = {};
    if (env) {
      lemon.extend(cur, { env: env});
    }
    if (serv) {
      lemon.extend(cur, { serv: serv});
    }
    if (envGroup) {
      lemon.extend(cur, { envGroup: envGroup});
    }
    if (apiGroup) {
      lemon.extend(cur, { apiGroup: apiGroup});
    }
    if (api) {
      lemon.extend(cur, { api: api});
    }
    current(cur);
  },
  snapshoot: function() {
    return {
      cur: current(),
      requ: mapi.requ.val(),
      resp: mapi.resp.val()
    };
  },
  snapload: function(snapdata) {
    snapdata = snapdata ? lemon.deepDec(snapdata) : lemon.persist('api_snapshoot');
    var choosed = snapdata.cur || {};
    current(choosed);

    if (choosed.env && choosed.envGroup && choosed.serv) {
      envs.doChoose(choosed.env, choosed.envGroup, choosed.serv);
    }
    if (choosed.apiGroup && choosed.api) {
      apis.doChoose(choosed.apiGroup, choosed.api);
    }

    mapi.requ.val(snapdata.requ);
    mapi.resp.val(snapdata.resp);
  },
  mirror: function(elId, sizeElId, options) {
    var instance = mirror(elId, options);
    mapi.mirrorSize(instance, sizeElId);
    return instance;
  },
  mirrorSize: function(aMirror, sizeElId) {
    aMirror.setSize($(sizeElId).width(), $(sizeElId).height() - 46);
  },
  intlRequ: function() {
    mapi.requ = mapi.mirror('#request', mapi.requCardId);

    if (lemon.isMediumUpView()) {
      var fromH = $(mapi.requCardId).height() - 46;
      $('#tab-form').css({
        width: $(mapi.requCardId).width(),
        height: fromH,
        'max-height': fromH,
        'overflow-y': 'scroll'
      });
    }

    $('#btn-tgl-form').click(function () {
      if (!mapi.requ.isJson()) {
        lemon.msg('The Request Data is not a Valid JSON or JSON5.');
        return;
      }

      //-> form
      if (lemon.buttonTgl(this)) {
        lemon.progress(mapi.requToolId);
        $.post('/general/form', {data: lemon.enc(mapi.requ.json())}).done(function (resp) {
          $('#tab-form').html(resp);
          lemon.tabShow('#tab-tri-form');
          lemon.progressEnd(mapi.requToolId);
        });

      }
      //-> json
      else {
        lemon.progress(mapi.requToolId);
        var aData = lemon.getParam('#tab-form');
        $.post('/general/convert', {
          data: lemon.enc(aData),
          original: lemon.enc(mapi.requ.val())
        }).done(function (resp) {
          if (0 == resp.code) {
            mapi.requ.json(lemon.dec(resp.result.data));
            lemon.tabShow('#tab-tri-mirror');
          } else {
            lemon.msg(resp.msg);
          }
          lemon.progressEnd(mapi.requToolId);
        });
      }
    });
  },
  intlResp: function () {
    mapi.resp = mapi.mirror('#response', mapi.respCardId);
  },
  intlDD: function() {
    envs.render();
    apis.render();
    lemon.delay(function () {
      mapi.snapload();
    }, 200);
  },
  resize: function() {
    var interval = 34;  //$(mapi.gridId).offset().top - $(mapi.navbarId).height();
    $(mapi.gridId).offset({
      top: ($(mapi.navbarId).height() + interval)
    });

    if (mapi.requ) {
      mapi.mirrorSize(mapi.requ, mapi.requCardId);
    }
    if (mapi.resp) {
      mapi.mirrorSize(mapi.resp, mapi.respCardId);
    }
  },
  initialize: function() {
    if (lemon.isSmallDownView()) {
      $('head').append('<style>li.nav-item { margin:0 0 5px 0; }</style>');
      $('#navbar-smdown-tgl').click(function() {
        lemon.delay(function () {
          mapi.resize();
        }, 100);
      });
    } else {
      lemon.console();
    }

    mapi.intlRequ();
    mapi.intlResp();
    mapi.intlDD();
    requs.init();
    history.init();

    //http://stackoverflow.com/questions/9626059/window-onbeforeunload-in-chrome-what-is-the-most-recent-fix
    $(window).on('beforeunload', function() {
      //var x =logout(); return x;
      leave();
    });

    $(window).resize(mapi.resize);
    mapi.resize();
  }
};

$(function () { mapi.initialize(); });


