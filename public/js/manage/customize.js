'use strict';

var tinycolor = require('tinycolor');

$(function () {

  var $ref = $("#ref");
  var config = {
    delayTime: 50,
    chart: {
      colorPrimary: tinycolor($ref.find(".chart .color-primary").css("color")),
      colorSecondary: tinycolor($ref.find(".chart .color-secondary").css("color"))
    }
  };

  var themeSettings = getThemeSettings();

  var $app = $('#app');
  var $styleLink = $('#theme-style');
  var $customizeMenu = $('#customize-menu');
  var $customizeMenuColorBtns = $customizeMenu.find('.color-item');
  var $customizeMenuRadioBtns = $customizeMenu.find('.radio');

  setThemeSettings();

  $customizeMenuColorBtns.on('click', function() {
    themeSettings.name = $(this).data('theme');

    setThemeSettings();
  });


  $customizeMenuRadioBtns.on('click', function() {

    var optionName = $(this).prop('name');
    var value = $(this).val();

    themeSettings[optionName] = value;

    setThemeSettings();
  });

  function setThemeSettings() {
    setThemeState()
      .delay(config.delayTime)
      .queue(function (next) {

        setThemeColor();
        setThemeControlsState();
        saveThemeSettings();

        $(document).trigger("themechange");

        next();
      });
  }

  function setThemeState() {
    if (themeSettings.name) {
      $styleLink.attr('href', '/dist/css/app-' + themeSettings.name + '.css');
    } else {
      $styleLink.attr('href', '/dist/css/app.css');
    }

    $app.removeClass('header-fixed footer-fixed sidebar-fixed');
    $app.addClass(themeSettings.headerPosition);
    $app.addClass(themeSettings.footerPosition);
    $app.addClass(themeSettings.sidebarPosition);
    return $app;
  }

  function setThemeControlsState() {
    // set color switcher
    $customizeMenuColorBtns.each(function() {
      if($(this).data('theme') === themeSettings.name) {
        $(this).addClass('active');
      }
      else {
        $(this).removeClass('active');
      }
    });

    $customizeMenuRadioBtns.each(function() {
      var name = $(this).prop('name');
      var value = $(this).val();

      if (themeSettings[name] === value) {
        $(this).prop("checked", true );
      }
      else {
        $(this).prop("checked", false );
      }
    });
  }

  function setThemeColor(){
    config.chart.colorPrimary = tinycolor($ref.find(".chart .color-primary").css("color"));
    config.chart.colorSecondary = tinycolor($ref.find(".chart .color-secondary").css("color"));
  }

  function getThemeSettings() {
    var settings = lemon.store('settings') || {}, theme = settings.theme || {};
    theme.headerPosition = theme.headerPosition || '';
    theme.sidebarPosition = theme.sidebarPosition || '';
    theme.footerPosition = theme.footerPosition || '';
    return theme;
  }

  function saveThemeSettings() {
    var settings = lemon.store('settings') || {};
    settings.theme = themeSettings;
    lemon.store('settings', settings);
  }

});
