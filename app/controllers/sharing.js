'use strict';

var express = require('express'),
  router = express.Router(),
  log = log_from('sharing'),
  Share = app_require('models/share'),
  ShareAccess = app_require('models/share_access'),
  History = app_require('models/api/history'),
  Group = app_require('models/api/group'),
  Interface = app_require('models/api/interf'),
  Note = app_require('models/note'),
  apiRequest = require('../helpers/api_request'),
  index = routes.share;

var requs = apiRequest();

module.exports = function (app) {
  app.use(index.action, router);
};

function views(share, callback, requestInfo) {
  share = _.extend({
    type: null,
    content: null,
    title: '',
    desc: '',
    read_write: null,
    from: {
      id: requestInfo.usr.id,
      name: requestInfo.usr.name,
      ip: requestInfo.clientIP
    },
    userl: requestInfo.usr.isAdmin ? 1 : 0
  }, share || {});

  if (!share.type || !share.content || !share.read_write) {
    return callback(answer.fail('invalid share'));
  }

  //API
  if (1 == share.type) {
    Interface.findById(share.content, function (err, anInterf) {
      if (err) {
        return callback(answer.fail(err.message));
      }

      if (!anInterf) {
        return callback(answer.fail('share API not exists'));
      }

      Group.find({id : anInterf.group_id}).limit(1).next(function(err, aGroup) {
        if (err) {
          return callback(answer.fail(err.message));
        }

        if (!aGroup) {
          return callback(answer.fail('share API Group not exists'));
        }

        var infos = {
          api: requs.getRespAPI(anInterf, requestInfo.usr),
          group: {
            id: aGroup.id,
            name: aGroup.name,
            desc: aGroup.desc
          }
        };

        _.extend(share, {
          content: crypto.compress(infos)
        });

        callback(answer.succ(share));
      });
    });
  }
  //API Snapshot, APIs Snapshot, Note Snapshot
  else if (2 == share.type || 7 == share.type || 5 == share.type) {
    _.extend(share, {
      content: crypto.compress(share.content)
    });

    callback(answer.succ(share));
  }
  //API History
  else if (3 == share.type) {
    var hisId = share.content, qry = History.idQueryParam(hisId);
    History.find(qry).limit(1).next(function(err, aHis) {
      if (err) {
        return callback(answer.fail(err.message));
      }

      if (!aHis) {
        return callback(answer.fail('share API history not exists'));
      }

      _.extend(share, {
        content: crypto.compress(aHis)
      });

      callback(answer.succ(share));
    });
  }
  //Note
  else if (4 == share.type) {
    var nid = share.content, qry = Note.idQueryParam(nid);
    Note.find(qry).limit(1).next(function(err, aNote) {
      if (err) {
        return callback(answer.fail(err.message));
      }

      if (!aNote) {
        return callback(answer.fail('share Note not exists'));
      }

      var rNote = Note.make(aNote);
      rNote.content = aNote.content;
      _.extend(share, {
        content: crypto.compress(rNote)
      });

      callback(answer.succ(share));
    });
  }
  //Unknown
  else {
    return callback(answer.fail('unknown share type ' + share.type));
  }
}

function shares(shareId, sharesResultCall, requestInfo) {
  if (!shareId || shareId.length < 1) {
    return sharesResultCall(answer.fail('invalid share id'));
  }

  var resultCall = function (sharesAns) {
    if (isAnswerSucc(sharesAns)) {
      sharesResultCall(sharesAns);
    } else {
      ShareAccess.add({
        type: 3,
        fail: sharesAns.msg,
        share_id: 0,
        share_read_write: 4,
        share: shareId.toString()
      }, function (accessAns) {
        if (!isAnswerSucc(accessAns)) {
          log.warn(accessAns.msg, 'Try Open ShareAccess.add');
        }

        sharesResultCall(sharesAns);
      }, requestInfo);
    }
  };

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
          read_write: aShare.read_write,
          content: crypto.decompress(aShare.content),
          from: aShare.create_by || {},
          userl: requestInfo.usr.isAdmin ? 1 : 0,
          source: crypto.compress(aShare._id.toString())
        };

        ShareAccess.add({
          share_id: aShare.id,
          share_read_write: aShare.read_write,
          share: shareId.toString()
        }, function (accessAns) {
          if (!isAnswerSucc(accessAns)) {
            return resultCall(accessAns);
          }

          if (1 == aShare.read_write) {
            Share.addUseCount(aShare, function(adducAns) {
              if (!isAnswerSucc(adducAns)) {
                return resultCall(adducAns);
              }

              callback(null, target);
            }, requestInfo);
          } else {
            callback(null, target);
          }

        }, requestInfo);
      });
    },

    function(target, callback) {
      views(target, function (viewAns) {
        if (isAnswerSucc(viewAns)) {
          callback(null, viewAns.result);
        } else {
          return resultCall(viewAns);
        }
      }, requestInfo);
    }
  ], function(err, result) {
    resultCall(answer.succ(result));
  });

}

/**
 * Share Create
 */
router.post(index.do, function (req, res, next) {
  if (req.anonymous) {
    return res.json(answer.resp(401));
  }

  var ans = deepParse(req.body.data);
  if (ans.isFail()) {
    return res.json(ans.target);
  }

  var params = ans.get();
  if (!params.type || !params.content) {
    return res.json(answer.fail('invalid params'));
  }

  Share.fastShare(params, function(fastAnswer) {
    if (!isAnswerSucc(fastAnswer)) {
      return res.json(fastAnswer);
    }

    return res.json(answer.succ(Share.shareData(fastAnswer.result)));
  }, requestInfo(req));

});

/**
 * Share Preview
 */
router.get(index.preview.do, function (req, res, next) {
  if (req.anonymous) {
    return res.render(index.preview, {
      ans: crypto.compress(answer.fail('anonymous'))
    });
  }

  var ans = deepParse(req.param('data'));
  if (ans.isFail()) {
    return res.render(index.preview, {
      ans: crypto.compress(ans.target)
    });
  }

  var share = ans.get();
  share = _.extend({
    read_write: 1
  }, share);

  views(share, function(anAnswer) {
    anAnswer.result = _.extend({
      preview: 1
    }, anAnswer.result);

    res.render(index.preview, {
      ans: crypto.compress(anAnswer)
    });
  }, requestInfo(req));
});

/**
 * Share content
 */
router.get(index.content.do, function (req, res, next) {
  var shareId = crypto.decompress(req.params.content || '');
  shares(shareId, function(anAnswer) {
    res.render(index.content, {
      ans: crypto.compress(anAnswer)
    });
  }, requestInfo(req));
});

/**
 * Share content with title
 */
router.get(index.contents.do, function (req, res, next) {
  var shareId = crypto.decompress(req.params.content || '');
  shares(shareId, function(anAnswer) {
    res.render(index.contents, {
      ans: crypto.compress(anAnswer)
    });
  }, requestInfo(req));
});
