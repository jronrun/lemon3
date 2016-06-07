'use strict';

var express = require('express'),
  router = express.Router(),
  log = log_from('general'),
  forms = app_require('helpers/forms'),
  index = routes.general;

module.exports = function (app) {
  app.use(index.action, router);
};

/**
 *
 */
router.get(index.do, function (req, res, next) {
  res.render(index);
});


/**
 * General data transfer {"a.b.c": 3} -> {a: {b: {c: 3}}}
 */
router.post(index.convert.do, function (req, res, next) {
  var target = crypto.decompress(req.body.data);
  try {
    target = JSON.parse(target);
  } catch (e) {
    return res.json(answer.fail('invalid JSON target: ' + e.message));
  }

  return res.json(answer.succ({
    data: crypto.compress(convertData(target))
  }));
});

/**
 * General form
 */
router.post(index.form.do, function (req, res, next) {
  var target = crypto.decompress(req.body.data);
  try {
    target = JSON.parse(target);
  } catch (e) {
    return res.json(answer.fail('invalid JSON target: ' + e.message));
  }

  res.render(index.form, {
    layout: false,
    form: forms.fromJSON(target)
  });
});
