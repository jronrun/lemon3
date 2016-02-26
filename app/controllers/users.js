var express = require('express'),
  router = express.Router(),
  log = log_from('notebook');

module.exports = function (app) {
  app.use('/user', router);
};

router.get('/', function (req, res, next) {
  res.render('users/index', {
  });
});
