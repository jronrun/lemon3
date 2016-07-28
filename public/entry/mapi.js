/**
 *
 */
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

    gets: function(instanceId) {
      return mapis.instances[instanceId] || null;
    }
  },

  newapi: function(instanceId) {
    return lemon.previews((location.origin || '') + '/api', function(view, preview) {
      mapis.instance.add(instanceId, view, preview);
    }, false, function(view) {
      $('body', view.getDocument()).css({
        'padding-top': '4.15rem'
      });
    });
  },

  initialize: function() {
    mapis.newapi(mapis.instance.defaultId);
  }
};

$(function () { mapis.initialize(); });
