'use strict';

require('animate.css');

lemon.register({
  animate: function (options) {
    var animationName = "animated " + options.name;
    var animationEnd = "webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend";
    $(options.selector).addClass(animationName).one(animationEnd, function () {
      $(this).removeClass(animationName);
    });
  }
});

var theme = {

    theme: function () {
      var settings = lemon.store('settings') || {}, theme = settings.theme || {},
        themeName = theme.name ? ('app-' + theme.name) : 'app';
      lemon.css('/dist/css/' + themeName + '.css', 'theme-style');
    },

    page_error: function() {
      var eId = '#err_able'; if ($(eId).length) {
        lemon.animate({
          name: 'flipInY',
          selector: '.error-card > .error-title-block'
        });

        setTimeout(function(){
          var $el = $('.error-card > .error-container');

          lemon.animate({
            name: 'fadeInUp',
            selector: $el
          });

          $el.addClass('visible');
        }, 1000);

        lemon.info('Internal Server Error: ' + $(eId + ' .error-sub-title').text());
        lemon.info($(eId + ' pre').text());
      }
    },

    initialize: function() {
      lemon.console();
      theme.theme();
      theme.page_error();
    }
};

$(function() { theme.initialize(); });
