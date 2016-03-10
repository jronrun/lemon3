var express = require('express'),
  router = express.Router(),
  log = log_from('home'),
  index = routes.home;

module.exports = function (app) {
  app.use(index.action, router);
};

router.get(index.do, function (req, res, next) {
  res.render(index);
});
