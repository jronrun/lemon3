/**
 *
 */
var mirror = require('../js/codemirror');

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
      return lemon.tmpl($('#dd_api_tmpl').html(), lemon.extend(apiInfo, {
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
          if (lemon.isView('xs', 'sm')) {
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

              if (lemon.isView('xs', 'sm')) {

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
            lemon.progress(apis.id + 't');
            var pn = parseInt($(apis.id).data('page')) + 1;
            apis.render(pn, function() {
              lemon.progressEnd(apis.id + 't');
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
      return lemon.tmpl($('#dd_env_group_tmpl').html(), lemon.extend(groupInfo, {
        env: envInfo
      }));
    }
  },

  servHead: {
    id: function(servId) {
      return '#server_' + servId;
    },
    render: function(envInfo, groupInfo, servInfo) {
      return lemon.tmpl($('#dd_server_tmpl').html(), lemon.extend(servInfo, {
        env: envInfo,
        group: groupInfo
      }));
    }
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

          if (lemon.isView('xs', 'sm')) {
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
            });
          });
        });

        if (1 == page) {
          lemon.scroll(envs.id, function () {
            lemon.progress(envs.id + 't');
            var pn = parseInt($(envs.id).data('page')) + 1;
            envs.render(pn, function() {
              lemon.progressEnd(envs.id + 't');
            });
          });
        }

      } else {
        lemon.msg(resp.msg);
      }

      lemon.isFunc(callback) && callback();
    });

    //$('#env_dd a').click(function(e) {
    //  e.stopPropagation();
    //}).dblclick(function(e) {
    //  $('#env_dd').click();
    //})
  }

};

var mapi = {
  requ: null,
  resp: null,
  mirror: function(elId, sizeElId, options) {
    var instance = mirror(elId, options);
    instance.setSize($(sizeElId).width(), $(sizeElId).height() - 46);
    return instance;
  },
  intlRequ: function() {
    var requCardEl = '#requ-card', requTool = '#requ-tool';
    mapi.requ = mapi.mirror('#request', requCardEl);

    if (lemon.isView(['md','lg'])) {
      var fromH = $(requCardEl).height() - 46;
      $('#tab-form').css({
        width: $(requCardEl).width(),
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
        lemon.progress(requTool);
        $.post('/general/form', {data: lemon.enc(mapi.requ.json())}).done(function (resp) {
          $('#tab-form').html(resp);
          lemon.tabShow('#tab-tri-form');
          lemon.progressEnd(requTool);
        });

      }
      //-> json
      else {
        lemon.progress(requTool);
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
          lemon.progressEnd(requTool);
        });
      }
    });
  },
  intlResp: function () {
    var respCardEl = '#resp-card', respTool = '#resp-tool';
    mapi.resp = mapi.mirror('#response', respCardEl);
  },
  intlDD: function() {
    envs.render();
    apis.render();
  },
  initialize: function() {
    if (lemon.isView('xs', 'sm')) {
      $('head').append('<style>li.nav-item { margin:0 0 5px 0; }</style>');
    }

    mapi.intlRequ();
    mapi.intlResp();
    mapi.intlDD();
  }
};

$(function () { mapi.initialize(); });


