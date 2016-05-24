'use strict';

var express = require('express'),
  router = express.Router(),
  note = require('../models/note'),
  log = log_from('notebook'),
  index = routes.notebook;

module.exports = function (app) {
  app.use(index.action, router);
};

/**
 * Notebook home
 */
router.get(index.do, function (req, res, next) {
  res.render(index);
});
