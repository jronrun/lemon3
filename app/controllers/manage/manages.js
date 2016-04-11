'use strict';

var express = require('express'),
  router = express.Router(),
  log = log_from('manage'),
  Power = app_require('models/power'),
  index = routes.manage;

module.exports = function (app) {
  app.use(index.action, router);
};

/**
 * Manage home
 */
router.get(index.do, function (req, res, next) {
  var usr = req.user;
  res.render(index, {
    username: usr.name,
    menus: getUserMenu(usr.resource)
  });
});

/**
 * Dashboard
 */
router.get(index.dashboard.do, function (req, res, next) {
  res.render(index.dashboard, {
    pagename: 'dashboard-page'
  });
});

/**
 * Power list
 */
router.get(index.powers.do, function (req, res, next) {
  res.render(index.powers.page, {
    pagename: 'items-list-page',
    pageedit: index.powers.editor.action
  });
});

/**
 * Power editor
 */
router.get(index.powers.editor.do, function (req, res, next) {
  res.render(index.powers.editor.page, {
    pagename: 'item-editor-page',
    schema: Power.desc(['resources'], true),
    res_tab: 1,
    desc: 'Power'
  });
});

/**
 * Whole resource tree
 */
router.post(index.resource.do, function (req, res, next) {
  res.render(index.resource, {
    nodes: getResourceTree()
  })
});

router.post(index.resource.power.do, function (req, res, next) {

});

router.post(index.resource.role.do, function (req, res, next) {

});

router.post(index.resource.user.do, function (req, res, next) {

});
