'use strict';

var express = require('express'),
  router = express.Router(),
  log = log_from('riches'),
  index = routes.rich;

module.exports = function (app) {
  app.use(index.action, router);
};

/**
 * Rich home
 */
router.get(index.do, function (req, res, next) {
  res.render(index);
});
