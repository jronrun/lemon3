'use strict';

var express = require('express'),
  router = express.Router(),
  log = log_from('merges'),
  index = routes.merge;

module.exports = function (app) {
  app.use(index.action, router);
};

/**
 * Merge home
 */
router.get(index.do, function (req, res, next) {
  res.render(index);
});
