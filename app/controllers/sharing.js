'use strict';

var express = require('express'),
  router = express.Router(),
  log = log_from('sharing'),
  Share = app_require('models/share'),
  index = routes.share;

module.exports = function (app) {
  app.use(index.action, router);
};

function shares(shareId) {


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
  res.render(index.content, shares(shareId));
});

/**
 * Share content with title
 */
router.get(index.contents.do, function (req, res, next) {
  var shareId = crypto.decompress(req.params.content || '');
  res.render(index.contents, shares(shareId));
});
