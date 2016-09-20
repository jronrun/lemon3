'use strict';

var express = require('express'),
  router = express.Router(),
  log = log_from('multi-notebook'),
  index = routes.notes;

module.exports = function (app) {
  app.use(index.action, router);
};

/**
 *
 */
router.get(index.do, function (req, res, next) {
  res.render(index);
});
