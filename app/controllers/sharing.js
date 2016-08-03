'use strict';

var express = require('express'),
  router = express.Router(),
  log = log_from('sharing'),
  Share = app_require('models/share'),
  History = app_require('models/api/history'),
  index = routes.share;

module.exports = function (app) {
  app.use(index.action, router);
};

function shares(shareId, resultCall, requestInfo) {
  if (!shareId || shareId.length < 1) {
    return resultCall(answer.fail('invalid share ID'));
  }

  async.waterfall([
    function(callback) {
      Share.findById(shareId, function (err, aShare) {
        if (err) {
          return resultCall(answer.fail(err.message));
        }

        if (!aShare) {
          return resultCall(answer.fail('share not exists'));
        }

        var ans = Share.isAvailable(aShare, requestInfo);
        if (!isAnswerSucc(ans)) {
          return resultCall(ans);
        }

        var target = {
          title: aShare.title || '',
          desc: aShare.desc || '',
          type: aShare.type,
          rw: aShare.read_write,
          content: aShare.content,
          from: aShare.create_by || {},
          userl: requestInfo.usr.isAdmin ? 1 : 0
        };

        callback(null, target);
      });
    },

    function(target, callback) {

      //API History
      if (3 == target.type) {
        var hisId = crypto.decompress(target.content);
        History.findById(hisId, function (err, aHis) {
          if (err) {
            return resultCall(answer.fail(err.message));
          }

          if (!aHis) {
            return resultCall(answer.fail('share API history not exists'));
          }

          _.extend(target, {
            content: crypto.compress(aHis)
          });

          callback(null, target);
        });
      }

    }
  ], function(err, result) {
    resultCall(answer.succ(result));
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
