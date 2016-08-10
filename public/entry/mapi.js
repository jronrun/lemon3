/**
 *
 */
var sharing =  require('../js/sharing');

function $$(selector, instanceId) {
  var aInstance = mapis.instance.gets(instanceId || mapis.instance.defaultId);
  if (!aInstance || !aInstance.view) {
    return [];
  }

  //jQuery $(selector, $('#iframe_id').contents())
  return $(selector, aInstance.view.getDocument())
}

var mapis = {

  tglBalance: {},
  instances: {},
  instance: {
    previous: null,
    current: null,
    count: 0,
    defaultId: null,

    add: function(view, preview, name) {
      var instanceId = (lemon.now() + '' + lemon.uniqueId());
      if (name && name.length > 0) {
        ++mapis.instance.count;
      }

      mapis.instances[instanceId] = {
        instanceId: instanceId,
        name: name || ('#' + (++mapis.instance.count)),
        view: view,
        preview: preview
      };

      return instanceId;
    },

    gets: function(instanceId) {
      return mapis.instances[instanceId] || null;
    },

    isLive: function(instanceId) {
      return null != mapis.instance.gets(instanceId);
    },

    active: function(instanceId) {
      if (instanceId) {
        if (instanceId == mapis.instance.current) {
          return;
        }

        mapis.instance.invisibleBut(instanceId);

        mapis.instance.previous = mapis.instance.current;
        mapis.instance.current = instanceId;
        lemon.buttonTgl('#mapi_tab_' + instanceId, 2);

        if (mapis.instance.previous) {
          lemon.buttonTgl('#mapi_tab_' + mapis.instance.previous, 3);
        }

        var inst = mapis.instance.gets(instanceId);
        if (inst) {
          inst.preview.show();
        }
      }
    },

    activePrevious: function() {
      mapis.instance.active(mapis.instance.isLive(
        mapis.instance.previous) ? mapis.instance.previous : mapis.instance.defaultId);
    },

    setDefault: function(instanceId) {
      mapis.instance.defaultId = instanceId;
      mapis.instance.current = instanceId;
      mapis.instance.gets(instanceId).isDefault = 1;
    },

    setName: function(instanceId, name) {
      var inst = mapis.instance.gets(instanceId);
      if (inst) {
        inst.name = name;
      }
    },

    invisibleBut: function(instanceId) {
      lemon.each(mapis.instances, function (inst, instId) {
        if (instId != instanceId) {
          inst.preview.hide();
        }
      });
    },

    destroy: function(instanceId) {
      var inst = mapis.instance.gets(instanceId);
      if (inst) {
        inst.preview.destroy();
        mapis.instances[instanceId] = null;
        delete mapis.instances[instanceId];
      }
    }
  },

  tools: null,
  toolsId: '#mapi_tools_id',
  tool: {

    initialize: function() {
      mapis.tools = lemon.popover('#mapi_tool', {
        arrow: false,
        trigger: 'manual',
        content: function() {
          return lemon.tmpl($('#mapi_tool_tmpl').html(), {});
        }
      }, {
        inserted: function(el) {
          $(el).hide();
        },
        shown: function(el) {
          var sw = $(window).width(), w = Math.floor(sw / 2) + 110, elW = sw - w - 5;
          $(el).css({
            width: elW,
            'max-width': elW,
            border: 0,
            top: -11,
            left: w
          }).attr('id', lemon.ltrim(mapis.toolsId, '#'));
          $(el).find('.popover-content').css({
            'padding': 0
          });

          $('#mapi_new').click(function () {
            var thiz = this; lemon.buttonTgl(thiz);
            mapis.addView(false, function() {
              lemon.buttonTgl(thiz);
            });
          });

          lemon.rightclick('#mapi_new', function() {
            var inputURLId = 'mapi_preview_url';
            var mapinM = lemon.modal({
              modal: {
                show: true
              },
              body: [
                '<div class="input-group input-group-lg">',
                '<input type="text" id="' + inputURLId + '" class="form-control" style="border: 0px;" placeholder="Enter an URL address">',
                '</div>'
              ].join('')
            }, {
              shown: function() {
                lemon.enter('#' + inputURLId, function () {
                  mapinM.hide();
                });
                $(mapis.toolsId).slideUp();
              },
              hide: function() {
                var aURL = $('#' + inputURLId).val();
                if (!/^(http|ftp|https):\/\//.test(aURL)) {
                  aURL = 'http://' + aURL;
                }

                if (lemon.isUrl(aURL)) {
                  mapis.addView(aURL);
                }

                $(mapis.toolsId).slideDown();
              }
            });
          });

          $(el).slideDown();
        }
      });

      mapis.tools.show();
    },

    refresh: function() {
      $('#mapi_tabs').empty().html(lemon.tmpl($('#mapi_tab_tmpl').html(), {
        mapis: mapis.instances
      }));

      $('button[id^="mapi_tab_"]').click(function () {
        var instId = lemon.data(this, 'instId');
        mapis.instance.active(instId);
      });

      $('a[id^="mapi_title_"]').click(function () {
        var instId = lemon.data(this, 'instId'), inputTitleId = 'input_mapi_inst_title_' + instId,
          originalTitle = lemon.trim($('#mapi_tab_' + instId).text());

        var titleM = lemon.modal({
          modal: {
            show: true
          },
          title: 'Set Title',
          body: [
            '<div class="input-group input-group-lg">',
            '<input type="text" id="' + inputTitleId + '" class="form-control" style="border: 0px;" placeholder="Set Manual API Title">',
            '</div>'
          ].join('')
        }, {
          shown: function() {
            if (originalTitle && originalTitle.length > 0) {
              $('#' + inputTitleId).val(originalTitle);
            }
            lemon.enter('#' + inputTitleId, function () {
              titleM.hide();
            });
            lemon.focusSelectAll('#' + inputTitleId);
            $(mapis.toolsId).slideUp();
          },
          hide: function() {
            var aTitle = $('#' + inputTitleId).val();
            if (aTitle && aTitle.length > 0) {
              $('#mapi_tab_' + instId).text(aTitle);
              mapis.instance.setName(instId, aTitle);
            }
          },
          hidden: function() {
            $(mapis.toolsId).slideDown();
          }
        });
      });

      $('a[id^="mapi_close_"]').click(function () {
        var instId = lemon.data(this, 'instId');
        mapis.instance.destroy(instId);
        $('#mapi_tool_' + instId).remove();
        if (mapis.instance.current == instId) {
          mapis.instance.activePrevious();
        }
      });

      $('#mapi-share').click(function () {
        lemon.store('mapi_snapshoot', null);
        mapis.snapshoot();
        lemon.delay(function () {
          var snapData = lemon.persist('mapi_snapshoot'), shareData = {
            title: 'APIs Snapshot',
            type: 7,
            content: snapData
          };
          sharing.createAndShow(shareData);
        }, 500);
      });

      lemon.rightclick('#mapi-share', function () {
        lemon.store('mapi_snapshoot', null);
        mapis.snapshoot();
        lemon.delay(function () {
          var snapData = lemon.persist('mapi_snapshoot'), data = {
            type: 7,
            content: snapData
          };

          lemon.preview(lemon.getUrl(lemon.fullUrl('/share/preview'), {
            data: lemon.enc(data)
          }));
        }, 500);
      });
    }
  },

  addView: function(theURL, callback, name) {
    mapis.createView(function(instanceId) {
      mapis.tool.refresh();
      mapis.instance.active(instanceId);
      lemon.isFunc(callback) && callback(instanceId);
    }, theURL, name);
  },

  createView: function(domReadyCallback, theURL, name) {
    theURL = theURL || lemon.fullUrl('/api');
    return lemon.previews(theURL, false, false, function(view, preview) {
      if (lemon.endWith(theURL, '/api')) {
        $('body', view.getDocument()).css({
          'padding-top': '4.15rem'
        });
      }

      var instanceId = mapis.instance.add(view, preview, name);
      lemon.isFunc(domReadyCallback) && domReadyCallback(instanceId, view, preview);
    });
  },

  loadsnap: function(mapiSnapdata) {
    if (lemon.isBlank(mapiSnapdata)) {
      return;
    }

    var insts = [];
    lemon.each(mapiSnapdata, function (inst) {
      insts.push(inst);
    });

    var loadInst = function(inst) {
      if (!inst) { return; }
      mapis.createView(function (instId) {
        if (inst.iframe.isDefault) {
          mapis.instance.setDefault(instId);
        }

        var anInst = mapis.instance.gets(instId);
        anInst.view.tellEvent('SNAPLOAD', {
          id: anInst.view.getId(),
          snapdata: inst.snapdata
        });

        if (!inst.iframe.isDefault) {
          mapis.tool.refresh();
          mapis.instance.active(instId);
        }

        loadInst(insts.shift());
      }, inst.iframe.src, inst.iframe.name);
    };

    loadInst(insts.shift());
    lemon.store('mapi_snapshoot', null);
  },
  snapshoot: function() {
    var anAPI = location.origin + '/api', asrc = null;
    lemon.each(mapis.instances, function (inst) {
      if (anAPI == (asrc = inst.view.attr('src'))) {
        inst.view.tellEvent('SNAPSHOOT', {
          tabName: inst.name,
          isDefault: inst.instanceId == mapis.instance.defaultId
        });
      } else {
        var shoot = {};
        shoot[inst.view.getName()] = {
          iframe: {
            api: false,
            isDefault: false,
            name: inst.name,
            src: asrc
          }
        };
        lemon.persist('mapi_snapshoot', shoot);
      }
    });
  },

  initialize: function() {
    if (lemon.isSmallDownView()) {
      lemon.href('/api');
      return;
    }

    lemon.console();

    if (lemon.isRootWin()) {
      var mapiSnapdata = lemon.persist('mapi_snapshoot');
      if (lemon.isBlank(mapiSnapdata)) {
        mapis.createView(function(instId) {
          mapis.instance.setDefault(instId);
          if (lemon.isMediumUpView()) {
            mapis.tool.initialize();
          }
        });
      } else {
        mapis.tool.initialize();
        mapis.loadsnap(mapiSnapdata);
      }
    }

    lemon.subMsg(function (data) {
      //lemon.info(data, 'Multiple API received msg');
      if (data && data.event) {
        switch (data.event) {
          case 'MODAL':
          case 'HEADER':
          case 'MIRROR_FULL':
          case 'BTN_TOGGLE':
            var viewId = data.iframe.id, view = mapis.tglBalance[viewId];
            if (!view) {
              view = mapis.tglBalance[viewId] = {
                count: 0
              };
            }

            if (1 == data.data.show) {
              ++view.count;
            } else {
              --view.count;
            }

            if (view.count > 0) {
              $(mapis.toolsId).slideUp();
            } else {
              $(mapis.toolsId).slideDown();
            }
            break;
          case 'SHARE_APIs_SNAPSHOT':
            var snapData = data.data.content;
            mapis.tool.initialize();
            mapis.loadsnap(snapData);
            break;
        }
      }
    });

    $(window).on('beforeunload', function() {
      if (lemon.isRootWin()) {
        mapis.snapshoot();
      }
    });
  }
};

$(function () { mapis.initialize(); });
