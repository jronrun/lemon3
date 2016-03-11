var express = require('express'),
  router = express.Router(),
  log = log_from('notebook'),
  index = routes.user;

module.exports = function (app) {
  app.use(index.action, router);
};

router.get(index.do, function (req, res, next) {
  res.render(index);
});

router.get(index.signin.do, function (req, res, next) {
  res.render(index.signin, {
    action: index.signin.action
  });
});

router.post(index.signin.do, function (req, res, next) {

  res.redirect(routes.home.action);
});

router.get(index.signup.do, function (req, res, next) {
  res.render(index.signup);
});

router.post(index.signup.do, function (req, res, next) {

});

router.post(index.signout.do, function (req, res, next) {

});
