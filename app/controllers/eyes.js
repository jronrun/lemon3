'use strict';

var express = require('express'),
  router = express.Router(),
  log = log_from('eyes'),
  index = routes.eyes;

module.exports = function (app) {
  app.use(index.action, router);
};

/**
 * Eyes home
 */
router.get(index.do, function (req, res, next) {
  res.render(index);
});
