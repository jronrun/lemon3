'use strict';

require('metisMenu/dist/metisMenu.css');
var metisMenu = require('metisMenu');

lemon.register({
  sourcetree: function(selector, src, options) {
    $.post(src || '/manage/resource', function (data) {
      $(selector).html(data);
      $(selector + ' em[collapsable="1"]').click(function () {
        $('#child-' + $(this).attr('child')).slideToggle("slow");
      });
      $(selector + ' em[id^="chkall-"]').click(function () {
        var thisId = $(this).attr('id'), sourceId = thisId.replace('chkall-', '');
        lemon.check('#' + thisId, 1);
        lemon.chkboxtgl('#base-' + sourceId + ',#child-' + sourceId + ' input');
      });
    });
  },
  chkboxtgl: function (selector) {
    var checkBoxes = $(selector);
    checkBoxes.prop("checked", !checkBoxes.prop("checked"));
  },
  chkboxval: function(name){
    return $("input:checked[name='" + name + "']").map(function(){
      return $(this).val();
    }).get();
  },
  check: function(selector, opt) {
    //opt undefined get value 1 checked 0 unchecked, 1 toggle, 2 check, 3 uncheck
    var check = 'fa-check-square-o', uncheck = 'fa-square-o';
    switch (opt = (opt || 4)) {
      case 1: $(selector).toggleClass(check); break;
      case 2: $(selector).addClass(check); break;
      case 3: $(selector).removeClass(check); break;
    }
    var isActive = $(selector).hasClass(check);
    if (4 == opt) {
      return isActive ? 1 : 0;
    }
    if (isActive) {
      $(selector).removeClass(uncheck).addClass(check);
    } else {
      $(selector).removeClass(check).addClass(uncheck);
    }

    return isActive ? 1 : 0;
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
