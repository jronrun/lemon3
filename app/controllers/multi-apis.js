'use strict';

var express = require('express'),
  router = express.Router(),
  log = log_from('multi-apis'),
  index = routes.apis;

module.exports = function (app) {
  app.use(index.action, router);
};

/**
 *
 */
router.get(index.do, function (req, res, next) {
  res.render(index);
});
