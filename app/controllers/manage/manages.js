'use strict';

var express = require('express'),
  router = express.Router(),
  log = log_from('manage'),
  index = routes.manage;

module.exports = function (app) {
  app.use(index.action, router);
};

router.get(index.do, function (req, res, next) {
  var usr = req.user;
  res.render(index, {
    username: usr.name,
    menus: getUserMenu(usr.resource)
  });
});

router.get(index.dashboard.do, function (req, res, next) {
  res.render(index.dashboard);
});

router.post(index.resource.do, function (req, res, next) {
  res.render(index.resource);
});

router.post(index.resource.power.do, function (req, res, next) {
  res.render(index.resource);
});

router.post(index.resource.role.do, function (req, res, next) {
  res.render(index.resource);
});

router.post(index.resource.user.do, function (req, res, next) {
  res.render(index.resource);
});
