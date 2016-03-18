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
