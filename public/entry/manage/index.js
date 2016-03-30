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
        var ctl = lemon.chkboxable('#' + thisId, 1);
        lemon.chkboxtgl('#base-' + sourceId + ',#child-' + sourceId + ' input', ctl == 1 ? 2 : 3);
      });
    });
  },
  /**
   * group checkbox toggle
   * @param selector
   * @param opt   if undefined get value 1 checked 0 unchecked, 1 toggle, 2 check, 3 uncheck
   * @returns {number}
     */
  chkboxtgl: function (selector, opt) {
    var checkBoxes = $(selector);
    switch (opt = (opt || 4)) {
      case 1: checkBoxes.prop('checked', !checkBoxes.prop('checked')); break;
      case 2: checkBoxes.prop('checked', true); break;
      case 3: checkBoxes.prop('checked', false); break;
    }
    return checkBoxes.prop('checked') ? 1 : 0;
  },
  chkboxval: function(name){
    return $("input:checked[name='" + name + "']").map(function(){
      return $(this).val();
    }).get();
  },
  /**
   * checkbox toggle with class
   * @param selector
   * @param opt   if undefined get value 1 checked 0 unchecked, 1 toggle, 2 check, 3 uncheck
   * @param checkClass
   * @param uncheckClass
   * @returns {number}
     */
  chkboxable: function(selector, opt, checkClass, uncheckClass) {
    var check = checkClass || 'fa-check-square-o', uncheck = uncheckClass || 'fa-square-o';
    switch (opt = (opt || 4)) {
      case 1: $(selector).toggleClass(check).toggleClass(uncheck); break;
      case 2: $(selector).addClass(check).removeClass(uncheck); break;
      case 3: $(selector).addClass(uncheck).removeClass(check); break;
    }
    return $(selector).hasClass(check) ? 1 : 0;
  }
});

var manage = {
  sidebar: function() {
    var $app = $('#app');
    $('#sidebar-menu, #customize-menu').metisMenu({
      activeClass: 'active open'
    });

    $('#sidebar-menu a[data-pjax]').click(function () {
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
