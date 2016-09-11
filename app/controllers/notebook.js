'use strict';

var express = require('express'),
  router = express.Router(),
  Note = require('../models/note'),
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

/**
 * Note List
 */
router.post(index.entities.do, function (req, res, next) {
  var noneQueryResult = answer.succ(crypto.compress({ items: [] }));
  if (req.anonymous) {
    return res.json(noneQueryResult);
  }

  Note.queryByKey({
    pn: parseInt(req.body.page || '1'),
    key: req.body.key,
    keyTag: req.body.tag
  }, function (qryAns) {
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

  Note.findById(req.params.id, function (err, result) {
    if (err) {
      return res.json(answer.fail(err.message));
    }

    if (!result) {
      return res.json(answer.fail('item not exists.'));
    }

    return ansEncode(answer.succ(result));
  });
});

/**
 * Note Update
 */
router.put(index.entity.do, function (req, res, next) {
  if (req.anonymous) {
    return res.json(answer.resp(401));
  }

  var tagOpt = req.body.tago, itemParse = deepParse(req.body.item);
  if (itemParse.isFail()) {
    return res.json(itemParse.target);
  }

  Note.updateBy(req.params.id, itemParse.get(), function (updateAns) {
    return res.json(updateAns);
  }, tagOpt);
});

/**
 * Note Delete
 */
router.delete(index.entity.do, function (req, res, next) {
  if (req.anonymous) {
    return res.json(answer.resp(401));
  }

  Note.removeById(req.params.id, function(err) {
    if (err) {
      return res.json(answer.fail(err.message));
    }

    var desc = options.descField ? result[options.descField] : '';
    return res.json(answer.succ(false, 'Remove ' + desc + ' success.'));
  });
});

