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
    qryAns.result = crypto.compress(qryAns.result);
    return res.json(qryAns);
  }, requestInfo(req));

});

/**
 * Note Create
 */
router.post(index.create.do, function (req, res, next) {
  res.json(answer.fail('Create'))
});

/**
 * Note Retrieve
 */
router.get(index.entity.do, function (req, res, next) {
  res.json(answer.fail('Retrieve'))
});

/**
 * Note Update
 */
router.put(index.entity.do, function (req, res, next) {
  res.json(answer.fail('Update'))
});

/**
 * Note Delete
 */
router.delete(index.entity.do, function (req, res, next) {
  res.json(answer.fail('Delete'))
});

