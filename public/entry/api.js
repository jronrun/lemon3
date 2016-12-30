/**
 *
 */
var mirror = require('../js/codemirror'),
  sharing =  require('../js/sharing');

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

  getHighlightDoc: function(target, rightTip, css, isDecode, attrs) {
    return lemon.getHighlightDoc(mirror, target, rightTip, css, isDecode, attrs);
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

  choose: function(apiId, srcFrom) {
    var elId = apis.apiHead.id(apiId);
    if (!$(elId).length) {
      return;
    }
    var data = {
      apiGroup: lemon.data(elId, 'group'),
      api: lemon.data(elId, 'api')
    };

    current(data);
    apis.doChoose(data.apiGroup, data.api, false, srcFrom);
  },

  //srcFrom 1 history, 2 which api click, 3 which api right click, 4 api search list, 5 snapload, 6 SHARE_API event
  doChoose: function(group, api, forceResp, srcFrom) {
    if (lemon.isJson(api.request || {})) {
      mapi.requ.json(api.request || {});
    }

    mapi.buttonTgl(mapi.tglDescId + ' em', 3);
    $(mapi.tglDescId).hide();

    if (!lemon.isBlank(api.response || {})) {
      switch (srcFrom) {
        case 2:
        case 3:
        case 4:
          var aApiResp = lemon.dec(api.response_doc);
          mapi.resp.val(aApiResp);
          break;
        case 1:
        case 5:
        case 6:
          var hisApiId = null;
          if (lemon.has(api, 'json') && api.json) {
            mapi.resp.json(api.response);
            if (1 === srcFrom) {
              hisApiId = api.id;
            }
          } else {
            try {
              mapi.resp.json(api.response);
              if (1 === srcFrom) {
                hisApiId = api.id;
              }
            } catch (e) {
              mapi.resp.val(lemon.dec(api.response));
            }
          }

          if (!lemon.isBlank(hisApiId)) {
            $(mapi.tglDescId).show();
            lemon.data(mapi.tglDescId, {
              aapi: api
            });
          }
          break;
      }

    } else if (forceResp) {
      mapi.resp.json({});
    }

    if (group.id) {
      envs.refresh(group.id);
      if (api.id) {
        apis.refresh(group.id, api.id);
      }
    }
  },

  render: function(page, callback) {
    var viewport = lemon.viewport();

    page = page || 1;
    $(apis.id).data('page', page);

    $.post('/api/interfaces', {
      source: mapi.source(),
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
                apis.choose(interf.id, 2);
              });
              if (lemon.isSmallDownView()) {

              } else {
                var title = [
                  '<span class="font-weight-bold text-muted">',
                  interf.name,
                  '</span>',
                  (2 == interf.mutation ? '<span class="tag tag-success pull-right">Mutation </span>' : ''),
                  '<span class="tag tag-info pull-right">',
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
                    });
                  },
                  shown: function(el) {
                    $(el).offset({
                      left: $(apis.id).offset().left + $(apis.id).width() + 10
                    });
                  }
                });

                lemon.rightclick(apiElId, function() {
                  apis.choose(interf.id, 3);
                  $(mapi.requDocId).click();
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
  cur: {
    envs: {},
    group: {},
    serv: {}
  },
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

  addCur: function(env, group, serv) {
    if (!envs.cur.envs[env.id]) {
      envs.cur.envs[env.id] = env;
    }

    if (!envs.cur.group[group.id]) {
      envs.cur.group[group.id] = group;
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

    if (serv.grant && serv.grant.length > 0) {
      lemon.data(mapi.grantId, {
        grant: serv.grant
      });
      $(mapi.grantId).show();
    } else {
      lemon.data(mapi.grantId, {
        grant: ''
      });
      $(mapi.grantId).hide();
    }
  },

  render: function(page, callback) {
    var viewport = lemon.viewport();

    page = page || 1;
    $(envs.id).data('page', page);

    $.post('/api/servers', {
      source: mapi.source(),
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

              envs.addCur(env.info, group.info, serv);

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
    $(requs.id).click(function() {
      requs.doBefore();
    });

    requs.advRequestM = lemon.modal({
      id: 'adv_request',
      cache: true,
      body: lemon.tmpl($('#advrequ_body_tmpl').html(), {}),
      footer: lemon.tmpl($('#advrequ_footer_tmpl').html(), {}),
      modal: {
        backdrop: 'static',
        keyboard: false
      }
    }, {
      shown: function(evt, el) {
        var advId = '#do_advrequ_request'; if ('1' != $(advId).attr('clicked')) {
          requs.advRequMirror = mapi.mirror('#advrequ_mirror', false, {
            gutters: [],
            cust: {
              escKey: false
            }
          });

          requs.advRequMirror.val(lemon.dec($(advId).data('advInit')));
          $(advId).attr('clicked', 1);
          $(advId).click(function () {
            if (requs.advRequMirror.isJson()) {
              requs.doBefore(requs.advRequMirror.json(), function() {
                requs.advRequestM.show();
              });
              requs.advRequestM.hide();
            } else {
              lemon.msg('Not a valid JSON', {
                containerId: '#advrequ_form'
              });
            }
          });
        }

        var choosed = current(), $tip = $('#advrequ_tip');
        if (choosed.env && choosed.envGroup && choosed.serv && choosed.serv.jsonp) {
          //A JSONP request works by creating a <script> element with its src attribute set to the request URL.
          //You cannot add custom headers to the HTTP request sent by a <script> element.
          var aTip = [
            choosed.env.name,
            choosed.envGroup.name,
            '-',
            choosed.serv.name
          ].join('&nbsp;&nbsp;');
          aTip = '<span class="text-' + choosed.env.level + '">' + aTip + '</span>';
          $tip.html(lemon.format('Headers cannot work for {0}', aTip));
        } else {
          $tip.html('');
        }
      }
    });

    lemon.rightclick(requs.id, function () {
      requs.advRequestM.show();
    });
  },

  doBefore: function (advance, cancelCallback) {
    var choosed = null;
    if (!(choosed = requs.check())) {
      return false;
    }

    lemon.disable(requs.id);
    var startRequ = function (requcb) {
      var pg = lemon.progress(mapi.navbarId);
      requs.request(function(apiResp, apiRequ, isSucc) {
        if (!batch.isBatch()) {
          lemon.enable(requs.id);
        }
        pg.end();
        lemon.isFunc(requcb) && requcb(apiResp, apiRequ, isSucc);
      }, advance);
    };

    var batchRequ = function () {
      if (batch.isBatch()) {
        mapi.locktb(true);
        mapi.lockRequTool();
        mapi.lockRespTool();
        batch.cfgdoc = lemon.enc(mapi.requ.val());
        batch.cfg = mapi.requ.json();
        batch.result = [];
        var bcfg = batch.cfg['$batch$'], bsetting = lemon.extend({
          interval: 300,
          request: 0,
          response: 1,
          query: null
        }, batch.cfg['$setting$']);

        if (lemon.isJson(bcfg)) {
          if (bcfg.param_name && lemon.isString(bcfg.param_name)
            && bcfg.values && lemon.isString(bcfg.values)) {
            var aValues = [];
            lemon.each(bcfg.values.split(','), function (v) {
              var aValue = {};
              aValue[bcfg.param_name] = v;
              aValues.push(aValue);
            });

            bcfg = aValues;
          }
        }

        if (lemon.isArray(bcfg)) {
          var totalRs = bcfg.length, currentRs = 0, unlocks = function() {
            mapi.unlocktb(true);
            mapi.unLockRequTool();
            mapi.unLockRespTool();
          }, batchDo = function () {
            if (bcfg.length > 0) {
              loadRequ(bcfg.shift());
            } else {
              mapi.requ.val(lemon.dec(batch.cfgdoc));
              // mapi.resp.json(batch.result);
              mapi.resp.json(lemon.queries(bsetting.query, batch.result));
              unlocks();
            }
          }, loadRequ = function (aRequ) {
            var pg = lemon.progress(mapi.navbarId);
            $.post('/general/convert', {
              data: lemon.enc(aRequ)
            }).done(function (resp) {
              pg.end();
              if (0 == resp.code) {
                var rjsonData = lemon.deepDec(resp.result.data);
                var theRequ = $.extend(true, {}, batch.cfg['$request$'], rjsonData);

                batch.setRequ(theRequ, rjsonData, '[' + (++currentRs) + ' / ' + totalRs + ']');
                startRequ(function (apiResp, apiRequ, isSucc) {
                  if (true === isSucc) {
                    batch.result.push(batch.getResult(rjsonData, apiRequ, apiResp, bsetting));
                    lemon.sleep(bsetting.interval);
                    batchDo();
                  } else {
                    lemon.msg(resp.msg);
                    unlocks();
                  }
                });
              } else {
                lemon.msg(resp.msg);
                unlocks();
              }
            });
          };

          batchDo();
        } else {
          lemon.msg('Invalid Batch Configuration in $batch$');
        }
      } else {
        startRequ();
      }
    };

    var formChkAndRequ = function () {
      if (mapi.isButtonActive('#btn-tgl-form em')) {
        mapi.form2json(function () {
          batchRequ();
        });
      } else {
        batchRequ();
      }
    };

    if (envs.isDanger()) {
      var env = choosed.env,
        tip = '<h5>Are you sure ?</h5> <span class="text-warning">{0} !!!</span>';
      lemon.confirm(lemon.format(tip, env.desc || env.name) , formChkAndRequ, function() {
        lemon.enable(requs.id);
        lemon.isFunc(cancelCallback) && cancelCallback();
      });
    } else {
      formChkAndRequ();
    }
  },

  check: function() {
    var choosed = current();
    if (!choosed.env || !choosed.envGroup || !choosed.serv) {
      lemon.msg('Please choose an Environment first.');
      return false;
    }

    //chosen API
    if (choosed.apiGroup && choosed.api) {
      //if (choosed.envGroup.id != choosed.apiGroup.id) {
      //  var tip = 'The chosen {0} server {1} does not support the {2} {3}';
      //  return lemon.msg(lemon.format(tip, choosed.envGroup.name, choosed.serv.name, choosed.apiGroup.name, choosed.api.name));
      //}
    }
    //unchosen API
    else {

    }

    if (!mapi.requ.isJson()) {
      lemon.msg('The Request Data is not a Valid JSON.');
      return false;
    }

    if (lemon.isDisable(requs.id)) {
      return false;
    }

    return choosed;
  },

  doResponse: function (anApi, data) {
    var aResult = null, showData = function (theData) {
      if (lemon.isString(theData)) {
        mapi.resp.val(theData);
      } else {
        mapi.resp.json(theData);
      }
    };

    if (anApi && anApi.settings && anApi.settings.single) {
      var scfg = lemon.extend({
        field: 1,
        comment: null,
        query: null
      }, anApi.settings.single || {});

      scfg.query = scfg.query || {};
      if (lemon.isBlank(scfg.field) || 1 === scfg.field) {
        scfg.field = null;
      }

      lemon.info(scfg, 'API single request setting');
      aResult = lemon.queries(scfg.query, data, scfg.field) || {};

      if (!lemon.isBlank(scfg.comment)) {
        if (1 === scfg.comment) {
          if (anApi.response_doc && anApi.response_doc.length > 0) {
            var updatePg = lemon.progress(mapi.respToolId);
            $.post('/general/update5', {
              params: lemon.enc({
                source: lemon.dec(anApi.response_doc),
                value: aResult
              })
            }).done(function (resp) {
              if (0 == resp.code) {
                var rdata = lemon.deepDec(resp.result);
                showData(rdata);
              } else {
                showData(aResult);
                lemon.warn(resp.msg, 'update5');
              }

              updatePg.end();
            });
          } else {
            showData(aResult);
          }
        } else {
          var comments = null, validC = null, commentData = null, matchedC = false;
          if (!lemon.isArray(scfg.comment)) {
            comments = [scfg.comment];
          } else {
            comments = scfg.comment;
          }

          lemon.each(comments, function (ac) {
            if (!matchedC && lemon.isString(ac) && ac.indexOf('|') !== -1) {
              var cArr = ac.split('|'), vPath = cArr[0], cPath = cArr[1];
              if (lemon.gets(aResult, vPath)) {
                if (lemon.gets(aResult, cPath)) {
                  matchedC = true;
                  validC = { vf: vPath, cf: cPath};
                  return false;
                } else if (lemon.gets(anApi.response || {}, cPath)) {
                  matchedC = true;
                  commentData = anApi.response;
                  validC = { vf: vPath, cf: cPath};
                  return false;
                }
              }
            }
          });

          if (lemon.isBlank(validC)) {
            lemon.warn(scfg.comment, 'Invalid comment setting, valid setting ${value field}|${comment field}');
            showData(aResult);
          } else {
            var acPg = lemon.progress(mapi.respToolId);
            $.post('/general/addcomment', {
              params: lemon.enc({
                data: aResult,
                commentData: commentData,
                valueField: validC.vf,
                commentField: validC.cf,
              })
            }).done(function (resp) {
              if (0 == resp.code) {
                var rdata = lemon.deepDec(resp.result);
                showData(rdata);
              } else {
                showData(aResult);
                lemon.msg(resp.msg);
              }

              acPg.end();
            });
          }
        }
      } else {
        showData(aResult);
      }
    } else {
      aResult = data;
      showData(aResult);
    }
  },

  request: function(callback, advance) {
    var choosed = current(), requ = mapi.requ.json(), data = {
      source: mapi.source(),
      env: choosed.env.id,
      group: choosed.envGroup.id,
      serv: choosed.serv.id,
      api: choosed.api ? choosed.api.id : -1,
      requ: lemon.enc(requ),
      advance: advance || {}
    };

    $.post('/api/request', { data: lemon.enc(data)}).done(function (resp) {
      var rdata = lemon.deepDec(resp.result || {});
      if (401 == resp.code) {
        lemon.isFunc(callback) && callback(resp, requ);
      } else if (0 == resp.code) {
        lemon.jsonp(rdata.path, rdata.data, {
          headers: rdata.headers
        }).done(function (data, textStatus, jqXHR) {
          lemon.info(textStatus, 'request status');
          lemon.info(data, 'response');
          requs.doResponse(choosed.api, data);

          lemon.isFunc(callback) && callback(data, requ, true);

          $.post('/api/history', {
            hisId: rdata.hisId,
            source: mapi.source(),
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

          lemon.isFunc(callback) && callback(resp, requ);
        });
      } else if (2 == resp.code) {
        requs.doResponse(choosed.api, rdata.data);

        lemon.isFunc(callback) && callback(resp, requ);
      } else {
        lemon.msg(resp.msg);
        if (lemon.isBlank(rdata)) {
          lemon.warn(resp.msg);
        } else {
          lemon.warn(rdata, resp.msg);
        }

        lemon.isFunc(callback) && callback(resp, requ);
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
          history.set(rdata.item);
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

  note: function(hisId, note) {
    $.post('/api/history/note', {
      hisId: hisId,
      note: lemon.enc(note)
    }).done(function (resp) {
      lemon.info(resp);
    });
  },

  set: function(his) {
    history.cur = his.id;
    envs.doChoose(his.env, his.group, his.serv);
    mapi.setCur(his.env, his.serv, his.group);
    apis.doChoose(his.group, his.api, true, 1);
    mapi.setCur(null, null, null, his.group, his.api);
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
  contentId: '#tab-api-search',

  partApiId: '#search-part-api',
  partHisId: '#search-part-his',

  apiEnd: false,
  hisEnd: true,

  prevKey: null,
  prevSearchType: 0,
  searchType: 0,

  advMirror: null,
  advModal: null,
  init: function() {
    lemon.enter(qry.inputId, function() {
      $(qry.searchId).click();
    });

    lemon.rightclick(qry.searchId, function () {
      qry.advModal.toggle();
    });

    $(qry.searchId).click(function () {
      if (lemon.buttonTgl(this)) {
        lemon.progress(mapi.navbarId);
        lemon.tabShow(mapi.triApiSearchId);
      } else {
        lemon.tabShow(mapi.triApiHomeId);
      }
    });

    $('#search_dd a').click(function () {
      var sType = parseInt($(this).data('type'));
      if (-1 == sType) {
        return;
      }
      if (100 == sType) {
        requs.advRequestM.show();
        return;
      }

      qry.searchType = sType;
      if (1 == qry.searchType) {
        qry.openSearch(qry.searchType);
      } else {
        $(qry.searchId).click();
      }
    });

    qry.advModal = lemon.modal({
      id: 'adv_search',
      cache: true,
      body: lemon.tmpl($('#adv_body_tmpl').html(), {}),
      footer: lemon.tmpl($('#adv_footer_tmpl').html(), {}),
      modal: {
        backdrop: 'static',
        keyboard: false
      }
    }, {
      shown: function(evt, el) {
        var advId = '#do_adv_search', advEnvId = '#adv_env_id', advGroupId = '#adv_group_id';
        if ('1' != $(advId).attr('clicked')) {
          qry.advMirror = mapi.mirror('#adv_mirror', false, {
            gutters: [],
            cust: {
              escKey: false
            }
          });
          qry.advMirror.val(lemon.dec($(advId).data('advinit')));

          $(advId).attr('clicked', 1);
          $(advId).click(function () {
            if (qry.advMirror.isJson()) {
              qry.advModal.toggle();
              qry.searchType = 4;
              $(qry.searchId).click();
            } else {
              lemon.msg('Not a valid JSON', {
                containerId: '#adv_form'
              });
            }
          });

          if (lemon.isSmallDownView()) {
            $(advEnvId).after('<h1 class="invisible"></h1>');
          }
        }

        var optionFmt = '<option value="{0}">{1}</option>', optSelFmt = '{0} option[value="{1}"]';
        lemon.each(envs.cur.envs, function (aEnv) {
          if (!$(lemon.format(optSelFmt, advEnvId, aEnv.id)).length) {
            $(advEnvId).append(lemon.format(optionFmt, aEnv.id, aEnv.name));
          }
        });

        lemon.each(envs.cur.group, function (aGroup) {
          if (!$(lemon.format(optSelFmt, advGroupId, aGroup.id)).length) {
            $(advGroupId).append(lemon.format(optionFmt, aGroup.id, aGroup.name));
          }
        });
      },
      hidden: function(current, soonToBeActive) {
        qry.searchType = 4;
      }
    });

    lemon.tabEvent(qry.contentId, {
      show: function(current, previous) {
        var viewport = lemon.viewport();

        $(qry.contentId).css({
          height: viewport.h * 0.86,
          'max-height': viewport.h * 0.86,
          'overflow-y': 'scroll'
        });

        mapi.locktb();
      },
      shown: function(current, previous) {
        qry.openSearch(qry.searchType);
      },
      hidden: function(current, soonToBeActive) {
        qry.prevMutation = null;
        qry.searchType = 0;
        mapi.unlocktb();
      }
    });
  },

  openSearch: function(searchType) {
    var searchKey = $(qry.inputId).val();
    switch (searchType) {
      //Define APIs
      case 2:
        $(qry.partHisId).empty();
      //default
      case 0:
        qry.apiEnd = false;
        qry.hisEnd = true;

        if (qry.prevSearchType != searchType || qry.prevKey != searchKey) {
          qry.prevKey = searchKey;
          $(qry.partApiId).empty();
          $(qry.partHisId).empty();

          qry.searchAPI(searchKey, 1, function() {
            lemon.progressEnd(mapi.navbarId);
            if (qry.apiEnd) {
              qry.addHisBtn();
            }
          });
        } else {
          lemon.progressEnd(mapi.navbarId);
          qry.scrollPage();
        }
        break;
      //Advance Search
      case 1:
        qry.advModal.toggle();
        break;
      //Do Advance Search
      case 4:
        qry.apiEnd = true;
        qry.hisEnd = false;

        var advQry = lemon.getParam('#adv_form');
        lemon.extend(advQry, {
          body: qry.advMirror.json()
        });

        $(qry.partApiId).empty();
        $(qry.partHisId).empty();
        qry.searchHis(advQry, 1, function() {
          lemon.progressEnd(mapi.navbarId);
        });
        break;
      //Histories
      case 3:
        qry.apiEnd = true;
        qry.hisEnd = false;

        $(qry.partApiId).empty();
        $('#btn_match_his').remove();
        if (qry.prevSearchType != searchType || qry.prevKey != searchKey) {
          qry.prevKey = searchKey;
        }
        qry.searchHis(qry.prevKey, 1, function() {
          lemon.progressEnd(mapi.navbarId);
        });
        break;
      case 5:
        qry.apiEnd = false;
        qry.hisEnd = true;

        if (qry.prevSearchType != searchType || qry.prevKey != searchKey) {
          qry.prevKey = searchKey;
          $(qry.partApiId).empty();
          $(qry.partHisId).empty();

          qry.prevMutation = 2;
          qry.searchAPI(searchKey, 1, function() {
            lemon.progressEnd(mapi.navbarId);
            if (qry.apiEnd) {
              qry.addHisBtn();
            }
          }, qry.prevMutation);
        } else {
          lemon.progressEnd(mapi.navbarId);
          qry.scrollPage();
        }
        break;
    }

    qry.prevSearchType = searchType;
  },

  scrollPage: function() {
    if ('1' != $(qry.contentId).attr('scrolled')) {
      lemon.scroll(qry.contentId, function () {
        if (!qry.apiEnd) {
          var pg = lemon.progress(mapi.navbarId);
          var pn = parseInt($(qry.partApiId).data('page')) + 1;
          qry.searchAPI(qry.prevKey, pn, function() {
            pg.end();
            if (qry.apiEnd) {
              qry.addHisBtn();
            }
          });
        } else if (!qry.hisEnd) {
          var pg = lemon.progress(mapi.navbarId);
          var pn = parseInt($(qry.partHisId).data('page')) + 1;
          qry.searchHis(qry.prevKey, pn, function() {
            pg.end();
          });
        }
      });

      $(qry.contentId).attr('scrolled', 1);
    }
  },

  toggleAPI: function(selector) {
    $(selector).each(function () {
      var type = $(this).attr('id').replace('apitgl_', ''), els = '[tgl-' + type + '="tgl"]';
      if (lemon.isButtonActive(this)) {
        $(els).slideUp();
      } else {
        $(els).slideDown();
      }
    });
  },

  searchAPI: function(key, page, callback, mutation) {
    page = page || 1;
    $(qry.partApiId).data('page', page);
    var fp = false;
    if (fp = (1 == page) && !$('#s_api_table').length) {
      $(qry.partApiId).append(lemon.tmpl($('#api_table_tmpl').html(), {}));
      $('#s_api_table button[id^="apitgl_"]').click(function () {
        lemon.buttonTgl(this);
        qry.toggleAPI(this);
      });
    }

    var qryData = {
      page: page,
      key: key
    };

    if (mutation) {
      lemon.extend(qryData, {
        mutation: mutation
      });
    }

    $.post('/api/interfaces', qryData, function (resp) {
      if (0 == resp.code) {
        if (resp.result.items.length > 0) {
          var baseW = Math.min($(window).width(), $(qry.partApiId).width());
          var preStyle = {
            'font-size': 14,
            padding: 9.5
          };

          if (lemon.isMediumUpView()) {
            lemon.extend(preStyle, {
              width: baseW - 105,
              'max-width': baseW - 105
            });
          } else {
            lemon.extend(preStyle, {
              width: baseW - 15,
              'max-width': baseW - 15
            });
          }

          var batchNo = 'api' + lemon.uniqueId();
          $('#s_api_tbody').append(lemon.tmpl($('#api_tr_tmpl').html(), {
            batchNo: batchNo,
            baseW: baseW,
            items: resp.result.items,
            highlight: function(doc, tip, attrs) {
              return apis.getHighlightDoc(doc, tip, preStyle, false, attrs);
            }
          }));

          $('td[clickable="' + batchNo + '"]').on('dblclick', function () {
            var api = lemon.data(this, 'api'), group = lemon.data(this, 'group');
            api.json = true;
            apis.doChoose(group, api, false, 4);
            mapi.setCur(null, null, null, group, api);
            $(qry.searchId).click();
          });

          $('tr[apigroupable="' + batchNo + '"]').click(function() {
            $('tr[apigroupc="' + lemon.data(this, 'groupId') + '"]').fadeToggle();
          });

          qry.toggleAPI('#s_api_table button[id^="apitgl_"]');

          qry.toggleItem(batchNo, 'btgl', 'btgl_', 'bapi_');
          qry.apiShare(lemon.format('button[id^="apishare_{0}_"]', batchNo));
          qry.apiBatchCfg(lemon.format('button[id^="apicfgbatchrequ_{0}_"]', batchNo));

          if (qry.prevKey && qry.prevKey.length > 0) {
            lemon.blast(qry.prevKey, qry.partApiId);
          }
        }

        if (!resp.result.hasNext ) {
          qry.apiEnd = true;
        }

        if (fp) {
          qry.scrollPage();
        }

        if (resp.result.items.length < 1 && fp) {
          $(qry.partApiId).empty();
          qry.hisEnd = false;
          var pg = lemon.progress(mapi.navbarId);
          qry.searchHis(qry.prevKey, 1, function() {
            pg.end();
          }, mutation);
        }

      } else {
        lemon.msg(resp.msg);
      }

      lemon.isFunc(callback) && callback();
    });
  },

  toggleHis: function(selector) {
    $(selector).each(function () {
      var type = $(this).attr('id').replace('histgl_', ''), els = '[tgl-' + type + '="tgl"]';
      if (lemon.isButtonActive(this)) {
        $(els).slideUp();
      } else {
        $(els).slideDown();
      }
    });
  },

  toggleItem: function(batchNo, tglMark, prefixBtn, prefixItem) {
    $(lemon.format('button[id^="{1}_{0}_"]', batchNo, tglMark)).click(function () {
      //1 batchNo, 2 type, 3 apiId
      var bid = $(this).attr('id'), binfo = bid.split('_'), prefixT = prefixBtn, prefixA = prefixItem,
        btype = binfo[2], tid = '#' + bid.replace(prefixT, prefixA), realId = null;
      if (lemon.buttonTgl(this)) {
        //requ
        if (['1', '3'].indexOf(btype) != -1) {
          $(realId = tid.replace('_3_', '_1_')).slideUp();
          lemon.buttonTgl(realId.replace(prefixA, prefixT), 2);
        }
        //resp
        if (['2', '3'].indexOf(btype) != -1) {
          $(realId = tid.replace('_3_', '_2_')).slideUp();
          lemon.buttonTgl(realId.replace(prefixA, prefixT), 2);
        }
      } else {
        //requ
        if (['1', '3'].indexOf(btype) != -1) {
          $(realId = tid.replace('_3_', '_1_')).fadeIn();
          lemon.buttonTgl(realId.replace(prefixA, prefixT), 3);
        }
        //resp
        if (['2', '3'].indexOf(btype) != -1) {
          $(realId = tid.replace('_3_', '_2_')).fadeIn();
          lemon.buttonTgl(realId.replace(prefixA, prefixT), 3);
        }
      }
    });
  },

  hisNote: function(selector) {
    $(selector).click(function () {
      var tmp = $(this).attr('id').split('_'), hisId = tmp[2], batchNo = tmp[1],
        aHis = lemon.data('#ahis_' + hisId, 'his'), inputNoteId = 'input_hisnote_' + hisId,
        viewNoteId = '#anote4his_' + batchNo + '_' + hisId;
        title = (aHis.api.name ? (aHis.api.name + ' '): '') + 'Note';
      var body = [
        '<textarea type="text" class="form-control borderinfo" rows="5" id="' + inputNoteId + '">',
        aHis.note || '',
        '</textarea>'
      ].join('');

      lemon.modal({
        title: title,
        titleClose: true,
        body: body,
        modal: {
          show: true,
          backdrop: 'static',
          keyboard: false
        }
      }, {
        hide: function() {
          var aNote = $('#' + inputNoteId).val() || '';
          aHis.note = aNote;
          lemon.data('#ahis_' + hisId, {
            his: aHis
          });

          $(viewNoteId).text(aNote).show();
          history.note(hisId, aNote);

          if (aNote.length < 1) {
            $(viewNoteId).text('').hide();
          }
        }
      });
    });
  },

  showApiBatchCfg: function (bid, apiId, cfgInit) {
    qry.batchCfgModal = lemon.modal({
      body: lemon.tmpls('#batchcfg_body_tmpl'),
      footer: lemon.tmpls('#batchcfg_footer_tmpl'),
      modal: {
        show: true,
        backdrop: 'static',
        keyboard: false
      }
    }, {
      hidden: function () {
        mapi.buttonTgl(bid, 3);
      },
      shown: function(evt, el) {
        mapi.buttonTgl(bid, 2);
        var doId = '#do_set_batchcfg', mid = '#batchcfg_mirror', fid = '#batchcfg_form';
        qry.batchCfgMirror = mirror(mid, {
          gutters: [],
          cust: {
            escKey: false,
            ctrl1Key: false
          }
        });

        qry.batchCfgMirror.val(lemon.fmtjson(cfgInit));

        $(doId).click(function () {
          var aCfg = null;
          if (qry.batchCfgMirror.isJson()
            && lemon.has((aCfg = qry.batchCfgMirror.json()), '$batch$')
            && lemon.has(aCfg, '$setting$')) {

            var pg = lemon.progress(mapi.navbarId + ',' + doId);
            $.post('/api/settings', {
              source: mapi.source(),
              params: lemon.enc({
                apiId: apiId,
                update: aCfg
              })
            }).done(function (resp) {
              if (0 == resp.code) {
                qry.batchCfgModal.hide();
              } else {
                lemon.msg(resp.msg, {
                  containerId: fid
                });
              }
              pg.end();
            });

          } else {
            lemon.msg('Not a valid Configuration', {
              containerId: fid
            });
          }
        });
      }
    });
  },

  apiBatchCfg: function (selector) {
    $(selector).click(function () {
      var eId = $(this).attr('id'), tmp = eId.split('_'), apiId = parseInt(tmp[2]), bid = '#' + eId + ' em';
        //anAPI = lemon.data('#anapi_' + apiId, 'api')

      var pg = lemon.progress(mapi.navbarId);
      $.post('/api/settings', {
        source: mapi.source(),
        params: lemon.enc({ apiId: apiId})
      }).done(function (resp) {
        if (0 == resp.code) {
          var rdata = lemon.dec(resp.result);
          qry.showApiBatchCfg(bid, apiId, rdata);
        } else {
          lemon.alert(resp.msg);
        }
        pg.end();
      });
    });
  },

  apiShare: function(selector) {
    $(selector).click(function () {
      var tmp = $(this).attr('id').split('_'), apiId = tmp[2],
        anAPI = lemon.data('#anapi_' + apiId, 'api');
      var shareData = {
        title: 'API ' + (anAPI.name || ''),
        type: 1,
        content: anAPI._id
      };
      sharing.createAndShow(shareData);
    });

    lemon.rightclick(selector, function(event) {
      var tmp = $(event.target).parent().attr('id').split('_'), apiId = tmp[2], batchNo = tmp[1],
        anAPI = lemon.data('#anapi_' + apiId, 'api');

      var data = {
        type: 1,
        content: anAPI._id
      };

      lemon.preview(lemon.getUrl(lemon.fullUrl('/share/preview'), {
        data: lemon.enc(data)
      }));
    });
  },

  hisShare: function(selector) {
    $(selector).click(function () {
      var tmp = $(this).attr('id').split('_'), hisId = tmp[2], batchNo = tmp[1],
        aHis = lemon.data('#ahis_' + hisId, 'his');

      var data = {
        type: 3,
        content: aHis.id
      };

      lemon.preview(lemon.getUrl(lemon.fullUrl('/share/preview'), {
        data: lemon.enc(data)
      }));
    });

    lemon.rightclick(selector, function(event) {
      var tmp = $(event.target).parent().attr('id').split('_'), hisId = tmp[2],
        aHis = lemon.data('#ahis_' + hisId, 'his');
      var shareData = {
        title: 'API History' + (aHis.api.name ? (' of ' + aHis.api.name) : ''),
        type: 3,
        content: aHis.id
      };
      sharing.createAndShow(shareData);
    });
  },

  hisToggleComment: function(selector, preStyle, batchNo) {
    $(selector).click(function () {
      var hisId = $(this).attr('id').split('_')[2], thiz = this;
      var aHis = lemon.data('#ahis_' + hisId, 'his'),
        hisRequId = '#bhis_' + batchNo + '_1_' + aHis.id, hisRequDocId = hisRequId + '_doc';

      if (lemon.buttonTgl(thiz)) {
        if (lemon.existsEl(hisRequDocId)) {
          $(hisRequId).hide();
          $(hisRequDocId).show();
        } else {
          var data = {
            serv: aHis.serv.id,
            requ: aHis.api.request,
            api: aHis.api.id
          };

          lemon.progress(mapi.navbarId);
          $.post('/api/comment', { params: lemon.enc(data) }).done(function (resp) {
            if (0 == resp.code) {
              var rdata = lemon.dec(resp.result);
              if (rdata && rdata.length > 0) {
                var theRequDoc = apis.getHighlightDoc(rdata, 'Request with Document', preStyle, true, {
                  id: lemon.ltrim(hisRequDocId, '#')
                });
                $(hisRequId).after(theRequDoc);
                $(hisRequId).hide();
              } else {
                lemon.buttonTgl(thiz);
                lemon.info('There is none document defined for ' + aHis.api.name);
              }
            } else {
              lemon.buttonTgl(thiz);
            }

            lemon.progressEnd(mapi.navbarId);
          });
        }

      } else {
        $(hisRequId).show();
        $(hisRequDocId).hide();
      }

    });
  },

  searchHis: function(key, page, callback, mutation) {
    page = page || 1;
    $(qry.partHisId).data('page', page);

    var fp = false;
    if (fp = (1 == page) && !$('#s_his_table').length) {
      $(qry.partHisId).append(lemon.tmpl($('#his_table_tmpl').html(), {}));
      $('#s_his_table button[id^="histgl_"]').click(function () {
        lemon.buttonTgl(this);
        qry.toggleHis(this);
      });
    }

    var data = {
      page: page
    };

    if (lemon.isString(key)) {
      lemon.extend(data, {
        key: key
      });

      if (mutation) {
        lemon.extend(data, {
          mutation: mutation
        });
      }
    } else {
      lemon.extend(data, {
        query: lemon.enc(key)
      });
    }

    $.post('/api/history/query', data, function (resp) {
      if (0 == resp.code) {
        var rdata = lemon.deepDec(resp.result);
        if (rdata.items.length > 0) {
          var baseW = Math.min($(window).width(), $(qry.partHisId).width());
          var preStyle = {
            'font-size': 12,
            padding: 9.5
          };

          if (lemon.isMediumUpView()) {
            lemon.extend(preStyle, {
              width: baseW - 105,
              'max-width': baseW - 105
            });
          } else {
            lemon.extend(preStyle, {
              width: baseW - 15,
              'max-width': baseW - 15
            });
          }

          var batchNo = 'his' + lemon.uniqueId();
          $('#s_his_tbody').append(lemon.tmpl($('#his_tr_tmpl').html(), {
            batchNo: batchNo,
            preStyle: preStyle,
            items: rdata.items,
            userl: (1 == rdata.userl ? true : false),
            highlight: function(doc, tip, attrs) {
              return apis.getHighlightDoc(lemon.fmtjson(doc), tip, preStyle, true, attrs);
            }
          }));

          $('td[clickable="' + batchNo + '"]').on('dblclick', function () {
            history.set(lemon.data(this, 'his'));
            $(qry.searchId).click();
          });

          $('tr[timegroupable="' + batchNo + '"]').click(function() {
            $('tr[timegroupc="' + lemon.data(this, 'timeId') + '"]').fadeToggle();
          });

          qry.toggleHis(lemon.format('#s_his_table button[id^="histgl_{0}_"]', batchNo));

          qry.toggleItem(batchNo, 'histgl', 'histgl_', 'bhis_');
          qry.hisToggleComment(lemon.format('#s_his_table button[id^="commenttgl_{0}_"]', batchNo), preStyle, batchNo);
          qry.hisNote(lemon.format('button[id^="hisnote_{0}_"], button[id^="anote4his_{0}_"]', batchNo));
          qry.hisShare(lemon.format('button[id^="hisshare_{0}_"]', batchNo));

          if (qry.prevKey && qry.prevKey.length > 0) {
            lemon.blast(qry.prevKey, qry.partHisId);
          }
        }

        if (!rdata.hasNext ) {
          qry.hisEnd = true;
        }

        if (rdata.items.length < 1 && fp) {
          $(qry.partHisId).empty();
        }

        if (fp) {
          qry.scrollPage();
        }

      } else {
        lemon.msg(resp.msg);
      }

      lemon.isFunc(callback) && callback();
    });
  },

  addHisBtn: function() {
    var mhisId = '#btn_match_his';
    if (!$(mhisId).length && !$('#s_his_table').length && [0, 5].indexOf(qry.searchType) != -1) {
      var aBtn = [
        '<button type="button" class="btn btn-info btn-lg btn-block" id="btn_match_his">',
        'Show Match Histories',
        '</button>'
      ].join('');
      $(qry.partHisId).append(aBtn);
      $(mhisId).click(function () {
        qry.hisEnd = false;
        var pg = lemon.progress(mapi.navbarId);
        qry.searchHis(qry.prevKey, 1, function() {
          pg.end();
          $(mhisId).slideUp(500, function() {
            $(mhisId).remove();
          });
        }, qry.prevMutation);
      });
    }
  }
};

var homes = {
  home: function(events) {
    lemon.tabEventOnce('#body-tab1', events);
    lemon.tabShow('#tab-tri-body-tab1');
  },
  tab2: function(events) {
    lemon.tabEventOnce('#body-tab2', events);
    lemon.tabShow('#tab-tri-body-tab2');
  }
};

var batch = {
  id: '#btn-batch',
  cfg: null,
  cfgdoc: '',
  result: [],
  isBatch: function () {
    return mapi.isButtonActive(batch.id + ' em');
  },

  tgl: function (showPrev) {
    if (!mapi.requ.isJson()) {
      return lemon.msg('The Request Data is not a Valid JSON.');
    }

    var choosed = current();
    if (!choosed.serv) {
      return lemon.msg('Please choose an Environment first.');
    }

    if (mapi.buttonTgl(batch.id + ' em')) {
      var pg = lemon.progress(mapi.requToolId);
      var data = {
        serv: choosed.serv.id,
        requ: mapi.requ.json(),
        prev: (true === showPrev ? (lemon.dec(batch.cfgdoc) || null) : null)
      };

      if (choosed.api) {
        lemon.extend(data, {
          api: choosed.api.id
        });
      }

      $.post('/api/batch', { params: lemon.enc(data) }).done(function (resp) {
        if (0 == resp.code) {
          var rdata = lemon.dec(resp.result);
          if (rdata && rdata.length > 0) {
            batch.cfg = mirror.parse(rdata);
            batch.cfgdoc = lemon.enc(rdata);
            mapi.requ.val(rdata);
          }
        } else {
          lemon.msg(resp.msg);
        }

        pg.end();
      });
    } else {
      if (null == batch.cfg && mapi.requ.isJson()) {
        batch.cfg = mapi.requ.json();
      }
      if (null != batch.cfg) {
        batch.cfgdoc = lemon.enc(mapi.requ.val());
        mapi.requ.json(batch.cfg['$request$']);
        batch.cfg = null;
      }
    }
  },

  getResult: function (shortRequ, apiRequ, apiResp, bSetting) {
    var aResult = {}, isRequNull = false, isRespNull = false;
    if (lemon.isString(bSetting.request)) {
      bSetting.request = [bSetting.request];
    }
    if (lemon.isString(bSetting.response)) {
      bSetting.response = [bSetting.response];
    }

    if (lemon.isArray(bSetting.request) && lemon.isArray(bSetting.response)) {
      lemon.extend(aResult, lemon.queries({}, apiRequ, bSetting.request));
      lemon.extend(aResult, lemon.queries({}, apiResp, bSetting.response));

      return aResult;
    }

    if (isRequNull = (null == bSetting.request)) {

    } else if (0 === bSetting.request) {
      aResult.request = shortRequ;
    } else if (1 == bSetting.request) {
      aResult.request = apiRequ;
    } else if (lemon.isArray(bSetting.request)) {
      aResult.request = lemon.queries({}, apiRequ, bSetting.request);
    }

    if (isRespNull = (null == bSetting.response)) {

    } else if (1 == bSetting.response) {
      aResult.response = apiResp;
    } else if (lemon.isArray(bSetting.response)) {
      aResult.response = lemon.queries({}, apiResp, bSetting.response);
    }

    if (isRequNull) {
      aResult = aResult.response || {};
    }
    if (isRespNull) {
      aResult = aResult.request || {};
    }

    return aResult;
  },

  setRequ: function (aRequ, aRequCfg, aProgress) {
    var requStr = [
      '/*',
      ' * Batch Request ' + aProgress,
      ' * ' + JSON.stringify(aRequCfg),
      ' */'
    ];
    requStr.push(JSON.stringify(aRequ));
    mapi.requ.val(lemon.fmtjson(requStr.join('\n')));
  }
};

var mapi = {
  share: '#share_this',
  shareSnap: '#btn-share-snap',

  viewUrlId: '#btn-show-url',
  tglCommentId: '#btn-tgl-comment',
  grantId: '#server_signin',
  tglDescId: '#btn-tgl-resp-desc',

  navbarId: '#navbar-layout',
  gridId: '#grid-layout',
  apiLayoutId: '#api-layout',

  requToolId: '#requ-tool',
  requCardId: '#requ-card',
  requDocId: '#btn-doc',

  respToolId: '#resp-tool',
  respCardId: '#resp-card',

  triApiHomeId: '#tab-tri-api-home',
  triApiSearchId: '#tab-tri-api-search',

  requ: null,
  resp: null,

  docPopover: null,

  locktb: function (includeSearch) {
    lemon.disable(mapi.navbarId + ' [navel="1"]');
    $(mapi.navbarId + ' [navel="2"]').addClass('disabled');
    if (true === includeSearch) {
      lemon.disable(qry.searchId);
    }
  },

  unlocktb: function (includeSearch) {
    lemon.enable(mapi.navbarId + ' [navel="1"]');
    $(mapi.navbarId + ' [navel="2"]').removeClass('disabled');
    if (true === includeSearch) {
      lemon.enable(qry.searchId);
    }
  },

  lockRequTool: function () {
    lemon.disable(mapi.requToolId + ' button');
  },
  unLockRequTool: function () {
    lemon.enable(mapi.requToolId + ' button');
  },

  lockRespTool: function () {
    lemon.disable(mapi.respToolId + ' button');
  },
  unLockRespTool: function () {
    lemon.enable(mapi.respToolId + ' button');
  },

  buttonTgl: function (selector, opt, oppositeClazz) {
    return lemon.clazzTgl(selector, 'text-info', opt, oppositeClazz || 'text-silver');
  },
  isButtonActive: function (selector) {
    return lemon.isClazzActive(selector, 'text-info');
  },

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
      btns: {
        batch: mapi.isButtonActive(batch.id + ' em'),
        comment: mapi.isButtonActive(mapi.tglCommentId + ' em')
      },
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
      apis.doChoose(choosed.apiGroup, choosed.api, false, 5);
    }

    mapi.requ.val(snapdata.requ);
    mapi.resp.val(snapdata.resp);

    if (snapdata.btns) {
      if (true === snapdata.btns.batch) {
        mapi.buttonTgl(batch.id + ' em', 2);
        batch.cfgdoc = lemon.enc(mapi.requ.val());
      }

      if (true === snapdata.btns.comment) {
        mapi.buttonTgl(mapi.tglCommentId + ' em', 2);
      }
    }
  },
  mirror: function(elId, sizeElId, options) {
    var instance = mirror(elId, options, {
      fullscreen: function(isFullscreen) {
        $(mapi.navbarId).toggle(!isFullscreen);
        lemon.pubEvent('MIRROR_FULL', {
          show: isFullscreen
        });
      }
    });
    mapi.mirrorSize(instance, sizeElId);
    instance.chgFontSize(14);
    return instance;
  },
  mirrorSize: function(aMirror, sizeElId) {
    if (sizeElId) {
      aMirror.setSize($(sizeElId).width(), $(sizeElId).height() - 46);
    }
  },
  mediumUpViewDoc: function(rdata, thiz) {
    var title = [
      '<span class="text-muted">API Document</span>',
      (2 == rdata.item.mutation ? '<span class="tag tag-success pull-right">Mutation </span>' : ''),
      '<span class="tag tag-info pull-right">',
      rdata.item.name,
      '</span>'
    ].join('');

    mapi.docPopover = lemon.popover(mapi.requDocId, {
      title: title,
      placement: 'right',
      trigger: 'manual',
      arrow: false,
      content: function() {
        return lemon.tmpl($('#api_doc_lg_tmpl').html(), {
          rdata: rdata,
          highlight: function(doc, tip) {
            return apis.getHighlightDoc(doc, tip);
          }
        });
      }
    }, {
      show: function(el) {
        $(el).hide();
      },
      shown: function(el) {
        var offset = $(mapi.respCardId).offset(),
          w = $(mapi.respCardId).width() + 43, h = $(mapi.respCardId).height() + 43;
        $(el).offset(offset);
        $(el).css({
          'min-width': w,
          'max-width': w,
          'min-height': h,
          'max-height': h,
          'overflow-y': 'scroll'
        });

        lemon.delay(function () {
          $(el).fadeIn();
        }, 300);

        var aItemId = '#api_doc_' + rdata.item.id, aHostId = '#api_doc_' + (rdata.host || {}).id;

        $('#doc_tgl_mutation').click(function () {
          if (lemon.buttonTgl(this)) {
            $(aItemId).hide();
            $(aHostId).fadeIn();
          } else {
            $(aHostId).hide();
            $(aItemId).fadeIn();
          }
        });
      },
      hidden: function(el) {
        lemon.buttonTgl(thiz);
      }
    });
    mapi.docPopover.show();
  },
  renderNavbarHeader: function() {
    $.post('/api/header').done(function (resp) {
      if (0 == resp.code) {
        var hdata = lemon.deepDec(resp.result);
        $('#navbar-header .p-1').html(lemon.tmpl($('#api_navbar_header_tmpl').html(), hdata));
      } else {
        lemon.msg(resp.msg);
      }
    });
  },
  intlRequ: function() {
    mapi.requ = mapi.mirror('#request', mapi.requCardId);

    $('#api-requ-left').click(function () {
      lemon.screenfull(function (isFull) {
        if (lemon.isMediumUpView()) {
          var orginalH = $(mapi.requCardId).height(), checkH = isFull ? 13 : 46;
          var offsetH = $(window).height() - $(mapi.requCardId).offset().top - orginalH - checkH;
          $(mapi.requCardId).css({
            height: orginalH + offsetH
          });
          $($(mapi.respCardId)).css({
            height: orginalH + offsetH
          });
        }

        mapi.resize();
      });
    });

    if (lemon.isMediumUpView()) {
      var fromH = $(mapi.requCardId).height() - 46;
      $('#tab-form').css({
        width: $(mapi.requCardId).width(),
        height: fromH,
        'max-height': fromH,
        'overflow-y': 'scroll'
      });
    }

    $(mapi.requDocId).click(function () {
      if (!mapi.requ.isJson()) {
        return lemon.msg('The Request Data is not a Valid JSON.');
      }

      var choosed = current();
      if (!choosed.serv) {
        return lemon.msg('Please choose an Environment first.');
      }

      var thiz = mapi.requDocId + ' em';
      if (mapi.buttonTgl(thiz)) {
        lemon.progress(mapi.requToolId);

        var data = {
          serv: choosed.serv.id,
          requ: mapi.requ.json()
        };

        if (choosed.api) {
          lemon.extend(data, {
            api: choosed.api.id
          });
        }

        $.post('/api/define', { params: data }).done(function (resp) {
          if (0 == resp.code) {
            var rdata = lemon.deepDec(resp.result);
            if (rdata.item) {
              if (lemon.isMediumUpView()) {
                mapi.mediumUpViewDoc(rdata, thiz);
              } else {
                mapi.buttonTgl(thiz);
                homes.tab2({
                  shown: function(elId) {
                    var aItemId = '#api_doc_' + rdata.item.id, aHostId = '#api_doc_' + (rdata.host || {}).id;

                    $(elId).html(lemon.tmpl($('#api_doc_tmpl').html(), {
                      rdata: rdata,
                      highlight: function(doc, tip) {
                        return apis.getHighlightDoc(doc, tip);
                      }
                    }));

                    $('#doc_tgl_mutation').click(function () {
                      if (lemon.buttonTgl(this)) {
                        $(aItemId).hide();
                        $(aHostId).fadeIn();
                      } else {
                        $(aHostId).hide();
                        $(aItemId).fadeIn();
                      }
                    });

                    $('#doc_close').click(function () {
                      homes.home();
                    });
                  }
                });
              }
            } else {
              mapi.buttonTgl(thiz);
              lemon.msg('There is none document defined.');
            }
          } else {
            mapi.buttonTgl(thiz);
            lemon.msg(resp.msg);
          }

          lemon.progressEnd(mapi.requToolId);
        });
      } else {
        if (mapi.docPopover) {
          mapi.docPopover.dispose();
          mapi.docPopover = null;
        }
      }

    });

    $(batch.id).click(function () {
      batch.tgl(true);
    });
    lemon.rightclick(batch.id, function () {
      batch.tgl(false);
    });

    $(mapi.tglCommentId).click(function () {
      if (!mapi.requ.isJson()) {
        return lemon.msg('The Request Data is not a Valid JSON.');
      }

      var choosed = current();
      if (!choosed.serv) {
        return lemon.msg('Please choose an Environment first.');
      }

      var thiz = mapi.tglCommentId + ' em';

      //comment
      if (mapi.buttonTgl(thiz)) {
        lemon.progress(mapi.requToolId);
        var data = {
          serv: choosed.serv.id,
          requ: mapi.requ.json()
        };

        if (choosed.api) {
          lemon.extend(data, {
            api: choosed.api.id
          });
        }

        $.post('/api/comment', { params: lemon.enc(data) }).done(function (resp) {
          if (0 == resp.code) {
            var rdata = lemon.dec(resp.result);
            if (rdata && rdata.length > 0) {
              mapi.requ.val(rdata);
            } else {
              mapi.buttonTgl(thiz);
            }
          } else {
            lemon.msg(resp.msg);
            mapi.buttonTgl(thiz);
          }

          lemon.progressEnd(mapi.requToolId);
        });
      }
      //json
      else {
        mapi.requ.json(mapi.requ.json());
      }
    });

    var tglformBid = '#btn-tgl-form';
    $(tglformBid).click(function () {
      if (!mapi.requ.isJson()) {
        return lemon.msg('The Request Data is not a Valid JSON.');
      }

      //-> form
      if (mapi.buttonTgl(tglformBid + ' em')) {
        lemon.progress(mapi.requToolId);
        $.post('/general/form', {data: lemon.enc(mapi.requ.json())}).done(function (resp) {
          $('#tab-form').html(resp);
          lemon.tabShow('#tab-tri-form');
          lemon.progressEnd(mapi.requToolId);
        });

      }
      //-> json
      else {
        mapi.form2json(function () {
          lemon.tabShow('#tab-tri-mirror');
        });
      }
    });

    $(mapi.viewUrlId).click(function () {
      var choosed = current();
      if (!choosed.env || !choosed.envGroup || !choosed.serv) {
        return lemon.msg('Please choose an Environment first.');
      }

      var choosed = current(), data = {
        source: mapi.source(),
        env: choosed.env.id,
        group: choosed.envGroup.id,
        serv: choosed.serv.id
      };

      lemon.progress(mapi.requToolId);
      var theAPI = {};
      if (mapi.requ.isJson()) {
        theAPI = mapi.requ.json();
      }

      lemon.extend(data, {
        requ: lemon.enc(theAPI)
      });

      $.post('/api/viewurl', data).done(function (resp) {
        if (0 == resp.code) {
          var rdata = lemon.deepDec(resp.result), headBtns = [],
            aURL = lemon.format('{0}?{1}', rdata.path, decodeURIComponent($.param(rdata.data)));

          headBtns.push({
            icon: 'pencil-square',
            title: 'Toggle request URL encode & decode',
            onClick: function (target) {
              if (lemon.buttonTgl(target.id)) {
                $(target.textId).val(lemon.format('{0}?{1}', rdata.path, $.param(rdata.data)));
              } else {
                $(target.textId).val(aURL);
              }
            }
          });

          sharing.shows({
            title: 'Request URL',
            link: aURL,
            qrclink: aURL,
            headBtns: headBtns
          });
        } else {
          lemon.msg(resp.msg);
        }

        lemon.progressEnd(mapi.requToolId);
      });

    });

    lemon.rightclick(mapi.viewUrlId, function () {
      var text = ''; if (mapi.requ.doc().somethingSelected()) {
        text = mapi.requ.doc().getSelection();
      } else {
        text = mapi.requ.val();
      }

      sharing.shows({
        title: 'QRCode',
        tab: 2,
        isURL: false,
        link: text
      });
    });

    lemon.rightclick('#btn-from-url', function() {
      lemon.delay(function() {
        mapi.requ.joinSepConfigTgl();
      }, 100);
    });

    $('#btn-from-url').click(function() {
      var pg = lemon.progress(mapi.requToolId);
      mapi.requ.joinOrParse(pg);
    });

    if (lemon.isMediumUpView()) {
      lemon.tabEventOnce('#tab-terminal', {
        shown: function(elId) {
          var terminalId = '#console';
          if (!$(terminalId).length) {
            $(elId).append(lemon.tmpl($('#requ_terminal_tmpl').html(), {

            }));
            $(terminalId).css({
              width: $(mapi.requCardId).width() - 46
            });
            lemon.consoles(terminalId, {
              executor: lemon.exe
            });

            $(terminalId + ' .jquery-console-inner').css({
              height: $(mapi.requCardId).height() - 57
            });
          }
        }
      });

      var terminalBid = '#btn-terminal';
      $(terminalBid).click(function () {
        if (mapi.buttonTgl(terminalBid + ' em')) {
          lemon.tabShow('#tab-tri-terminal');
        } else {
          lemon.tabShow('#tab-tri-mirror');
        }
      });

      $(mapi.shareSnap).click(function () {
        var snapData = mapi.snapshoot(), shareData = {
          title: 'API Snapshot' + ((snapData.cur && snapData.cur.api) ? (' of ' + snapData.cur.api.name) : ''),
          type: 2,
          content: snapData
        };
        sharing.createAndShow(shareData);
      });

      lemon.rightclick(mapi.shareSnap, function(event) {
        var snapData = mapi.snapshoot(), data = {
          type: 2,
          content: snapData
        };

        lemon.preview(lemon.getUrl(lemon.fullUrl('/share/preview'), {
          data: lemon.enc(data)
        }));
      });
    }
  },
  form2json: function (successCall) {
    lemon.progress(mapi.requToolId);
    var aData = lemon.getParam('#tab-form');
    $.post('/general/convert', {
      data: lemon.enc(aData),
      original: lemon.enc(mapi.requ.val())
    }).done(function (resp) {
      if (0 == resp.code) {
        var rjsonData = lemon.dec(resp.result.data);
        mapi.requ.json(rjsonData);
        lemon.isFunc(successCall) && successCall(rjsonData);
      } else {
        lemon.msg(resp.msg);
      }
      lemon.progressEnd(mapi.requToolId);
    });
  },
  intlResp: function () {
    mapi.resp = mapi.mirror('#response', mapi.respCardId);

    $(mapi.grantId).click(function () {
      var grant = lemon.dec(lemon.data(mapi.grantId, 'grant'));
      if (grant && grant.length > 0) {
        lemon.preview(grant);
      }
    });
    lemon.rightclick(mapi.grantId, function() {
      var grant = lemon.dec(lemon.data(mapi.grantId, 'grant'));
      if (grant && grant.length > 0) {
        var grantW = window.open(grant, '_blank');
        grantW.focus();
      }
    });

    $(mapi.tglDescId).click(function () {
      var thiz = mapi.tglDescId + ' em', aapi = lemon.data(mapi.tglDescId, 'aapi');
      if (mapi.buttonTgl(thiz)) {
        if (mapi.resp.isJson()) {
          var pg = lemon.progress(mapi.respToolId);
          $.post('/api/definebyid', {
            id: aapi.id
          }).done(function (resp) {
            if (0 == resp.code) {
              var rdata = lemon.deepDec(resp.result);
              requs.doResponse(rdata, mapi.resp.json());
            } else {
              mapi.buttonTgl(thiz, 3);
              lemon.warn(resp.msg, 'toggle response description');
            }
            pg.end();
          });
        } else {
          mapi.buttonTgl(thiz, 3);
        }
      } else {
        try {
          mapi.resp.json(aapi.response);
        } catch (e) {/**/}
      }
    });


    var btnPreviewId = '#btn_preview', doPreview = function () {
      lemon.preview(mapi.resp.selected(), false, {
        mirror: mirror,
        isDecode: true
      });
    };
    $(btnPreviewId).click(function () {
      if (lemon.isRootWin()) {
        doPreview();
      } else {
        lemon.pubEvent('BTN_TOGGLE', {
          show: mapi.buttonTgl(btnPreviewId + ' em') ? 1 : 0
        });
      }
    });

    lemon.rightclick(btnPreviewId, function() {
      if (!lemon.isRootWin()) {
        doPreview();
      }
    });

    var noteId = '#api_note', mergeId = '#api_merge', richId = '#api_rich', doOpens = function (uri, snapData) {
      var pg = lemon.homeProgress();
      apis.apiNoteInst = lemon.preview(lemon.fullUrl(uri), false, false, function(view, previewM) {
        mapi.noteView = view;
        mapi.noteView.tellEvent('SNAPLOAD', snapData || {});
        pg.end();
      }, false, {
        hide: function () {
          mapi.noteView.tellEvent('LEAVE', false, function () {
            mapi.noteView = null;
          });
        }
      });
    };
    $(noteId).click(function () {
      doOpens('/note');
    });
    lemon.rightclick(noteId, function() {
      var snap = mapi.snapshoot(), content = lemon.enc(['/** Request **/', snap.requ, '\n/** Response **/', snap.resp].join('\n'));
      doOpens('/note', {
        snapdata: {
          note: {
            content: content
          },
          mirror: {
            mode: {
              name: 'JSON-LD',
              chosen: 'application/ld+json'
            }
          }
        }
      });
    });

    $(mergeId).click(function () {
      doOpens('/merge');
    });
    lemon.rightclick(mergeId, function() {
      doOpens('/merge', {
        snapdata: {
          info: {
            mime: 'application/ld+json'
          },
          vals: {
            is2Panels: true,
            right: mapi.resp.val()
          }
        }
      });
    });

    $(richId).click(function () {
      doOpens('/rich');
    });
    lemon.rightclick(richId, function() {
      doOpens('/rich', {
        snapdata: {
          type: 1,
          val: apis.getHighlightDoc(mapi.resp.val(), '', false, true)
        }
      });
    });

  },
  intlDD: function() {
    if (lemon.isRootWin()) {
      envs.render();
      apis.render();
      lemon.delay(function () {
        mapi.snapload();
      }, 200);
    }
  },
  resize: function() {
    var interval = 34;  //$(mapi.gridId).offset().top - $(mapi.navbarId).height();
    $(mapi.apiLayoutId).offset({
      top: ($(mapi.navbarId).height() + interval)
    });

    if (mapi.requ) {
      mapi.mirrorSize(mapi.requ, mapi.requCardId);
    }
    if (mapi.resp) {
      mapi.mirrorSize(mapi.resp, mapi.respCardId);
    }
  },

  disableRequest: function() {
    $(requs.id).replaceWith($(requs.id).clone());
    lemon.disable(requs.id);
  },
  shareShow: function(shareData) {
    $(mapi.share).show({
      complete: function() {
        $(mapi.share).click(function() {
          sharing.createAndShow(shareData);
        });
      }
    });
  },
  shares: function(share, callback) {
    if ([2, 3, 7].indexOf(share.type) != -1) {
      var choosed = current();
      if (mapi.requ.isJson() && choosed.serv) {
        $(mapi.tglCommentId).click();
      }
    }

    $(mapi.viewUrlId).remove();
    if (1 == share.read_write) {
      $(batch.id).remove();
      mapi.disableRequest();
    }

    lemon.data('body', {
      sid: share.instanceId,
      source: share.source
    });

    if (lemon.isFunc(callback)) {
      envs.render(1, function() {
        apis.render(1, function() {
          lemon.delay(function () {
            callback();
          }, 100);
        });
      });
    } else {
      envs.render();
      apis.render();
    }
  },
  source: function() {
    return lemon.data('body', ['sid', 'source']);
  },
  initialize: function() {
    lemon.homeProgress();
    if (lemon.isSmallDownView()) {
      $('head').append('<style>li.nav-item { margin:0 0 5px 0; }</style>');
      $('#navbar-smdown-tgl').click(function() {
        lemon.delay(function () {
          mapi.resize();
        }, 500);
      });
    } else {
      $(mapi.requCardId).css({
        border: 0
      });
      $(mapi.respCardId).css({
        border: 0
      });

      lemon.console();
    }

    mapi.intlRequ();
    mapi.intlResp();
    mapi.intlDD();
    requs.init();
    history.init();
    qry.init();
    mapi.renderNavbarHeader();

    $('#navbar-header-tgl').click(function() {
      lemon.delay(function () {
        var show = $('#navbar-header').hasClass('in') ? 1 : 0;
        lemon.pubEvent('HEADER', {
          show: show
        });
      }, 600);
    });

    lemon.subMsg(function (data) {
      //lemon.info(data, 'API received msg');
      var closePreview = function() {
        lemon.previewInstance && lemon.previewInstance.hide();
      };
      if (data && data.event) {
        switch (data.event) {
          case 'SIGNIN':
            location.reload();
            break;
          case 'SIGNUP':
          case 'SIGNOUT':
            closePreview();
            mapi.renderNavbarHeader();
            break;
          case 'SNAPSHOOT':
            var shoot = {};
            shoot[data.iframe.name] = {
              id: data.data.id,
              iframe: {
                type: 2,
                isDefault: data.data.isDefault,
                name: data.data.tabName,
                src: data.iframe.src
              },
              snapdata: mapi.snapshoot()
            };
            lemon.persist('mapi_snapshoot', shoot);
            break;
          case 'SNAPLOAD':
            //if (!lemon.isRootWin()) {
            //  if (data.data.id == lemon.iframes().getId()) {
            //
            //  }
            //}

            mapi.snapload(data.data.snapdata);
            break;
          case 'SHARE_HIS':
            $(mapi.shareSnap).remove();
            mapi.shares(data.data, function() {
              history.set(data.data.content);
            });
            break;
          case 'SHARE_API':
            $(mapi.shareSnap).remove();
            var content = data.data.content;
            if (1 == data.data.preview) {
              mapi.shareShow({
                title: 'API ' + (content.api.name || ''),
                type: 1,
                content: content.api._id
              });
            }

            mapi.shares(data.data, function() {
              apis.doChoose(content.group, content.api, true, 6);
              mapi.setCur(null, null, null, content.group, content.api);
            });
            break;
          case 'SHARE_API_SNAPSHOT':
            $(mapi.shareSnap).remove();
            var snapData = data.data.content;
            if (1 == data.data.preview) {
              mapi.shareShow({
                title: 'API Snapshot' + ((snapData.cur && snapData.cur.api) ? (' of ' + snapData.cur.api.name) : ''),
                type: 2,
                content: snapData
              });
            }

            mapi.shares(data.data, function() {
              mapi.snapload(snapData);
            });
            break;
          case 'SHARE_APIs':
            mapi.shares(data.data);
            break;
          case 'INST_RENDER':
            envs.render();
            apis.render();
            break;
          case 'NOTE_CLOSE':
            apis.apiNoteInst && apis.apiNoteInst.hide();
            break;
        }
      }
    });

    lemon.unload(function () {
      if (lemon.isRootWin()) {
        leave();
      }
    });

    $(window).resize(mapi.resize);
    mapi.resize();
    lemon.delay(function () {
      lemon.homeProgressEnd();
    }, 900);
  }
};

$(function () { mapi.initialize(); });


