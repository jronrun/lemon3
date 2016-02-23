var express = require('express'),
  router = express.Router(),
  Article = require('../models/article');

module.exports = function (app) {
  app.use('/', router);
};

router.get('/', function (req, res, next) {
  var articles = [new Article({
    title: 'abc', url: 'baidu.com', text: 'teaa'
  }), new Article({
    title: 'def', url: 'sohu.com', text: 'hell'
  })];
    res.render('index', {
      title: 'aab',
      articles: articles
    });
});
