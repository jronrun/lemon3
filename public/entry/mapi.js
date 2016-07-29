/**
 *
 */

function $$(selector, instanceId) {
  var aInstance = mapis.instance.gets(instanceId || mapis.instance.defaultId);
  if (!aInstance || !aInstance.view) {
    return [];
  }

  return $(selector, aInstance.view.getDocument())
}

var mapis = {

  instances: {},
  instance: {
    count: 0,
    defaultId: null,

    add: function(name, view, preview) {
      var instanceId = (lemon.now() + '' + lemon.uniqueId());
      view.apiInstanceId = instanceId;
      preview.apiInstanceId = instanceId;

      mapis.instances[instanceId] = {
        name: name || ('API ' + (++mapis.instance.count)),
        view: view,
        preview: preview
      };

      return instanceId;
    },

    gets: function(instanceId) {
      return mapis.instances[instanceId] || null;
    },

    setDefault: function(instanceId) {
      mapis.instance.defaultId = instanceId;
      mapis.instance.gets(instanceId).isDefault = 1;
    },

    setName: function(instanceId, name) {
      var inst = mapis.instance.gets(instanceId);
      if (inst) {
        inst.name = name;
      }
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
          });

          $(el).find('.popover-content').css({
            'padding': 0
          });

          $('#mapi_new').click(function () {
            var thiz = this; lemon.buttonTgl(thiz);

            mapis.createView(function() {
              mapis.tool.refresh();
              lemon.buttonTgl(thiz);
            });
          });

          mapis.tool.refresh();
          $(el).slideDown();
        }
      });

      mapis.tools.show();
    },

    refresh: function() {
      $('#mapi_tabs').empty().html(lemon.tmpl($('#mapi_tab_tmpl').html(), {
        mapis: mapis.instances
      }));

      $('button[id^="mapi_name_"]').click(function () {
        var instId = lemon.data(this, 'instId');
      });

      $('a[id^="mapi_title_"]').click(function () {
        var instId = lemon.data(this, 'instId'), inputTitleId = 'input_mapi_inst_title_' + instId,
          originalTitle = lemon.trim($('#mapi_name_' + instId).text());

        lemon.modal({
          modal: {
            show: true
          },
          title: 'Set Title',
          body: [
            '<div class="input-group input-group-lg">',
            '<input type="text" id="' + inputTitleId + '" class="form-control" style="border: 0px;" placeholder="Set' +
            ' Manual API Title">',
            '</div>'
          ].join('')
        }, {
          shown: function() {
            if (originalTitle && originalTitle.length > 0) {
              $('#' + inputTitleId).val(originalTitle);
            }
          },
          hide: function() {
            var aTitle = $('#' + inputTitleId).val();
            if (aTitle && aTitle.length > 0) {
              $('#mapi_name_' + instId).text(aTitle);
              mapis.instance.setName(instId, aTitle);
            }
          }
        });
      });

      $('a[id^="mapi_close_"]').click(function () {
        var instId = lemon.data(this, 'instId');
        mapis.instance.destroy(instId);
        $('#mapi_tool_' + instId).remove();
      });
    }
  },

  createView: function(domReadyCallback, name) {
    return lemon.previews((location.origin || '') + '/api', false, false, function(view, preview) {
      $('body', view.getDocument()).css({
        'padding-top': '4.15rem'
      });

      var instanceId = mapis.instance.add(name, view, preview);
      lemon.isFunc(domReadyCallback) && domReadyCallback(instanceId, view, preview);
    });
  },

  initialize: function() {
    mapis.createView(function(instId) {
      mapis.instance.setDefault(instId);

      if (lemon.isMediumUpView()) {
        mapis.tool.initialize();
      }
    }, 'Default');

    //TODO remove
    global.mapis = mapis;
    global.$$ = $$;
  }
};

$(function () { mapis.initialize(); });
