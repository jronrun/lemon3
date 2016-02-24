var express = require('express'),
  router = express.Router(),
  log = log_from('home');

module.exports = function (app) {
  app.use('/', router);
};

router.get('/', function (req, res, next) {
  res.render('index', {

  });
});
