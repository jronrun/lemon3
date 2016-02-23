var express = require('express'),
  router = express.Router();

module.exports = function (app) {
  app.use('/notebook', router);
};

router.get('/', function (req, res, next) {
  res.render('notebook/index', {
  });
});
