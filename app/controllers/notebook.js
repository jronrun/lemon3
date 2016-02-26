var express = require('express'),
  router = express.Router(),
  note = require('../models/note'),
  log = log_from('notebook');

module.exports = function (app) {
  app.use('/notebook', router);
};

router.get('/', function (req, res, next) {

  async.waterfall([
    function(callback) {
      callback(null, 'one', 'two');
    },
    function(arg1, arg2, callback) {
      // arg1 now equals 'one' and arg2 now equals 'two'
      callback(null, 'three');
    },
    function(arg1, callback) {
      // arg1 now equals 'three'
      setTimeout(function () {
        callback(null, 'done');
      }, 3000);

    },
    function(arg1, callback) {
      note.nextId(function (id) {
        callback(null, arg1 + ' ' + id);
      });
    }
  ], function (err, result) {
    // result now equals 'done'
    log.info('result: ' +result);
    return result;
  });

  note.findById('56cd685a795aa57d37df8613', function(err, doc) {
    log.info(doc);
  });

  note.nextId().then(function (id) {
    log.info('nextId: ' + id);
  });

  note.nextId(function (id) {
    log.info('nextId: ' + id);
  });

  res.render('notebook/index', {
  });
});
