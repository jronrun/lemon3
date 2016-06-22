'use strict';

var express = require('express'),
  router = express.Router(),
  log = log_from('apis'),
  index = routes.api,

  Environment = app_require('models/api/env'),
  Group = app_require('models/api/group'),
  Server = app_require('models/api/server'),
  Interface = app_require('models/api/interf');

module.exports = function (app) {
  app.use(index.action, router);
};

/**
 * APIs home
 */
router.get(index.do, function (req, res, next) {
  res.render(index);
});

/**
 * API Servers (Environment)
 */
router.post(index.servers.do, function (req, res, next) {

});

/**
 * API Interfaces (Which API)
 */
router.post(index.interfaces.do, function (req, res, next) {

});
