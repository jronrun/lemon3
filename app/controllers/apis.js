'use strict';

var express = require('express'),
  router = express.Router(),
  log = log_from('apis'),
  index = routes.api;

module.exports = function (app) {
  app.use(index.action, router);
};

/**
 * APIs home
 */
router.get(index.do, function (req, res, next) {
  res.render(index);
});
