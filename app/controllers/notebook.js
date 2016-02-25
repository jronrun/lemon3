var express = require('express'),
  router = express.Router(),
  note = require('../models/note'),
  log = log_from('notebook');

module.exports = function (app) {
  app.use('/notebook', router);
};

router.get('/', function (req, res, next) {

  note.findById('56cd685a795aa57d37df8613', function(err, doc) {
    log.info(doc);
  });

  note.nextId().then(function (id) {
    log.info('nextId: ' + id);
  });

  res.render('notebook/index', {
  });
});
