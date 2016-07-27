'use strict';

var express = require('express'),
  router = express.Router(),
  log = log_from('sharing'),
  index = routes.share;

module.exports = function (app) {
  app.use(index.action, router);
};

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

});

/**
 * Share content with title
 */
router.get(index.contents.do, function (req, res, next) {

});
