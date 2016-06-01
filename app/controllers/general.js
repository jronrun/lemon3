'use strict';

var express = require('express'),
  router = express.Router(),
  log = log_from('general'),
  index = routes.general;

module.exports = function (app) {
  app.use(index.action, router);
};

/**
 *
 */
router.get(index.do, function (req, res, next) {
  res.render(index);
});

/**
 * General form
 */
router.get(index.form.do, function (req, res, next) {
  res.render(index.form, {
    layout: false
  });
});
