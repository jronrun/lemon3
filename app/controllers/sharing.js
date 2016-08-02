'use strict';

var express = require('express'),
  router = express.Router(),
  log = log_from('sharing'),
  Share = app_require('models/share'),
  index = routes.share;

module.exports = function (app) {
  app.use(index.action, router);
};

function shares(shareId, callback, requestInfo) {
  if (!shareId || shareId.length < 1) {
    return callback(answer.fail('invalid share ID'));
  }

  Share.findById(shareId, function (err, aShare) {
    if (err) {
      return callback(answer.fail(err.message));
    }

    if (!aShare) {
      return callback(answer.fail('share not exists'));
    }

    var ans = Share.isAvailable(aShare, requestInfo);
    if (!isAnswerSucc(ans)) {
      return callback(ans);
    }

    callback(answer.succ({
      title: aShare.title || '',
      desc: aShare.desc || '',
      type: aShare.type,
      rw: aShare.read_write,
      content: aShare.content,
      from: aShare.create_by.name
    }));
  });
}

/**
 * Share Create
 */
router.post(index.do, function (req, res, next) {
  //result.insertedId.toString()
});

/**
 * Share content
 */
router.get(index.content.do, function (req, res, next) {
  var shareId = crypto.decompress(req.params.content || '');
  shares(shareId, function(answer) {
    res.render(index.content, {
      ans: crypto.compress(answer)
    });
  }, requestInfo(req));
});

/**
 * Share content with title
 */
router.get(index.contents.do, function (req, res, next) {
  var shareId = crypto.decompress(req.params.content || '');
  shares(shareId, function(answer) {
    res.render(index.contents, {
      ans: crypto.compress(answer)
    });
  }, requestInfo(req));
});
