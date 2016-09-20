'use strict';

var express = require('express'),
  router = express.Router(),
  Note = require('../models/note'),
  Tag = app_require('models/tag'),
  log = log_from('notebook'),
  index = routes.note;

module.exports = function (app) {
  app.use(index.action, router);
};

/**
 * Notebook home
 */
router.get(index.do, function (req, res, next) {
  res.render(index);
});

router.get(index.load.do, function (req, res, next) {
  if (req.anonymous) {
    return res.render(index);
  }

  return res.render(index, {
    nid: req.params.id
  });
});

/**
 * Note List
 */
router.post(index.entities.do, function (req, res, next) {
  var noneQueryResult = answer.succ(crypto.compress({ items: [] }));
  if (req.anonymous) {
    return res.json(noneQueryResult);
  }

  Note.queryByKey({
    ps: 5,
    pn: parseInt(req.body.page || '1'),
    key: req.body.key,
    keyTag: req.body.tag
  }, function (qryAns) {
    qryAns.result.userl = req.user.isAdmin ? 1 : 0;
    return res.json(ansEncode(qryAns));
  }, requestInfo(req));

});

/**
 * Note Create
 */
router.post(index.create.do, function (req, res, next) {
  if (req.anonymous) {
    return res.json(answer.resp(401));
  }

  var dataParse = deepParse(req.body.data);
  if (dataParse.isFail()) {
    return res.json(dataParse.target);
  }

  Note.fastNote(dataParse.get(), function (createAns) {
    return res.json(ansEncode(createAns));
  }, requestInfo(req));
});

/**
 * Note Retrieve
 */
router.get(index.entity.do, function (req, res, next) {
  if (req.anonymous) {
    return res.json(answer.resp(401));
  }

  Note.getNoteById(req.params.id, function (getAns) {
    return res.json(ansEncode(getAns));
  }, requestInfo(req));

});

/**
 * Note Update
 */
router.put(index.entity.do, function (req, res, next) {
  if (req.anonymous) {
    return res.json(answer.resp(401));
  }

  var tagOpt = req.body.tags, itemParse = deepParse(req.body.data);
  if (itemParse.isFail()) {
    return res.json(itemParse.target);
  }

  Note.updateBy(req.params.id, itemParse.get(), function (updateAns) {
    return res.json(updateAns);
  }, requestInfo(req), tagOpt);
});

/**
 * Note Delete
 */
router.delete(index.entity.do, function (req, res, next) {
  if (req.anonymous) {
    return res.json(answer.resp(401));
  }

  Note.updateBy(req.params.id, {state: 9}, function (updateAns) {
    return res.json(updateAns);
  }, requestInfo(req));
});

/**
 * Note Tags
 */
router.post(index.tag.do, function (req, res, next) {
  if (req.anonymous) {
    return res.json(answer.resp(401));
  }

  var tagQry = {
    type: 3,
    'create_by.id': req.user.id
  };

  Tag.find(tagQry, {
    type: 0,
    create_by: 0,
    last_modify_time: 0,
    create_time: 0
  }).sort({_id: -1}).toArray(function (err, items) {
    if (err) {
      return res.json(answer.fail(err.message));
    }

    var theTags = {};
    _.each(items || [], function (t) {
      theTags[t.id] = t;
    });

    return res.json(ansEncode(answer.succ(theTags)));
  });

});
