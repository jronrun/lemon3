/**
 *
 */
// var golden = require('golden-layout');
require('golden-layout/src/css/goldenlayout-base.css');
require('golden-layout/src/css/goldenlayout-light-theme.css');
var GoldenLayout = require('imports?window=>global!golden-layout/dist/goldenlayout');

var helper = function (inst, options) {
  options = options || {};
  var tools = {
    target: inst,

    contentStyle: function (targetCss) {
      $('.lm_content').css(targetCss || {});
      return tools;
    },

    register: function (name, component) {
      inst.registerComponent(name, component);
      return tools;
    },

    onLayout: function (evtName, evtCall) {
      if (lemon.isFunc(evtCall)) {
        inst.on(evtName, evtCall);
      }
      return tools;
    },

    init: function (initializedCall) {
      if (lemon.isFunc(initializedCall)) {
        tools.onLayout('initialised', function () {
          return initializedCall(inst);
        });
      }
      inst.init();
      return tools;
    },

    rowColumnTgl: function(beforeCall, afterCall) {
      lemon.isFunc(beforeCall) && beforeCall();
      var oldEl = inst.root.contentItems[ 0 ],
        newEl = inst.createContentItem({
          type: oldEl.isRow ? 'column' : 'row',
          content: []
        }), i;

      //Prevent it from re-initialising any child items
      newEl.isInitialised = true;

      for( i = 0; i < oldEl.contentItems.length; i++ ) {
        newEl.addChild( oldEl.contentItems[ i ] );
      }

      inst.root.replaceChild( oldEl, newEl );
      lemon.isFunc(afterCall) && afterCall();
    }
  };

  return tools;
};

var gl = function (config, options) {
  options = lemon.extend({
  }, options || {});
  config = config || {};

  config.settings = lemon.extend({
    hasHeaders: false
  }, config.settings || {});

  config.dimensions = lemon.extend({
    minItemHeight: 0
  }, config.dimensions || {});

  var inst = new GoldenLayout(config);

  return helper(inst, options);
};

gl.kits = function (componentName, componentState, type, options) {
  return lemon.extend({
    type: type || 'component',  //Can be row, column, stack, component or root
    componentName: componentName,
    componentState: componentState || {}
  }, options || {});
};

module.exports = gl;
