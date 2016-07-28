/**
 *
 */
var mapis = {

  newapi: function() {
    return lemon.previews((location.origin || '') + '/api', function(view, preview) {

    }, false, function(view) {
      $('body', view.getDocument()).css({
        'padding-top': '4.15rem'
      });
    });
  },

  initialize: function() {
    mapis.newapi();
  }
};

$(function () { mapis.initialize(); });
