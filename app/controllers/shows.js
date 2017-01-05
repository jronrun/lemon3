'use strict';

var express = require('express'),
  router = express.Router(),
  log = log_from('shows'),
  index = routes.show;

module.exports = function (app) {
  app.use(index.action, router);
};

/**
 * View home
 */
router.get(index.do, function (req, res, next) {
  res.render(index);
});
