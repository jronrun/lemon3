'use strict';

var express = require('express'),
  router = express.Router(),
  log = log_from('notebook'),
  user = app_require('models/user'),
  index = routes.user;

module.exports = function (app) {
  app.use(index.action, router);
};

router.get(index.do, function (req, res, next) {
  res.render(index);
});

router.get(index.signin.do, function (req, res, next) {
  res.render(index.signin, {

  });
});

router.post(index.signin.do, function (req, res, next) {

  res.redirect(routes.home.action);
});

router.get(index.signup.do, function (req, res, next) {
  res.render(index.signup);
});

router.post(index.signup.do, function (req, res, next) {
  log.info(req.body);
});

router.post(index.signout.do, function (req, res, next) {

});
