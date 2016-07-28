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
    defaultId: 'default',

    autoId: function() {
      return (lemon.now() + '' + lemon.uniqueId());
    },

    add: function(instanceId, view, preview) {
      instanceId || mapis.instance.autoId();
      view.apiInstanceId = instanceId;
      preview.apiInstanceId = instanceId;

      mapis.instances[instanceId] = {
        view: view,
        preview: preview
      };
    },

    getDefault: function() {
      return mapis.instance.gets(mapis.instance.defaultId);
    },
    gets: function(instanceId) {
      return mapis.instances[instanceId] || null;
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
          var w = Math.floor($(window).width() / 2);
          $(el).css({
            width: w,
            'max-width': w,
            border: 0,
            top: -11,
            left: w + 110,
            'z-index': 50001
          });

          $(el).find('.popover-content').css({
            'padding': 0
          });

          $(el).slideDown();
        }
      });

      mapis.tools.show();
    }
  },

  newapi: function(instanceId, domReadyCallback) {
    return lemon.previews((location.origin || '') + '/api', function(view, preview) {
      mapis.instance.add(instanceId, view, preview);
    }, false, function(view, preview) {
      $('body', view.getDocument()).css({
        'padding-top': '4.15rem'
      });

      lemon.isFunc(domReadyCallback) && domReadyCallback(view, preview);
    });
  },

  initialize: function() {
    mapis.newapi(mapis.instance.defaultId, function() {
      if (lemon.isMediumUpView()) {
        mapis.tool.initialize();
      }
    });

    //TODO remove
    global.mapis = mapis;
    global.$$ = $$;
  }
};

$(function () { mapis.initialize(); });
