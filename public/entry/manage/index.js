'use strict';

require('metisMenu/dist/metisMenu.css');
var metisMenu = require('metisMenu');

lemon.register({
  sourcetree: function(selector, src, options) {
    $.post(src || '/manage/resource', function (data) {
      $(selector).html(data);
    });
  },
  chkboxval: function(name){
    return $("input:checked[name='" + name + "']").map(function(){
      return $(this).val();
    }).get();
  }
});

$(function () {
  //test
  lemon.sourcetree('#thetree');
});

var manage = {
  sidebar: function() {
    var $app = $('#app');
    $('#sidebar-menu, #customize-menu').metisMenu({
      activeClass: 'active open'
    });

    $('#sidebar-menu > li > a[data-pjax]').click(function () {
      if ($app.hasClass('sidebar-open')) {
        lemon.delay(function() {
          $app.removeClass("sidebar-open");
        }, 600);
      }
    });

    $('#sidebar-collapse-btn').on('click', function(event){
      event.preventDefault();

      $app.toggleClass("sidebar-open");
    });

    $("#sidebar-overlay").on('click', function() {
      $app.removeClass("sidebar-open");
    });
  },

  nav: function() {
    $('.nav-profile > li > a').on('click', function() {
      var $el = $(this).next();

      lemon.animate({
        name: 'flipInX',
        selector: $el
      });
    });
  },

  initialize: function() {
    manage.sidebar();
    manage.nav();
  }
};

$(function () { manage.initialize(); });
require('../../js/manage/customize');
