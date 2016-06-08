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
    target = convertData(json5s.parse(target));
  } catch (e) {
    return res.json(answer.fail('invalid JSON target: ' + e.message));
  }

  if (req.body.original) {
    var originalJSON5 = crypto.decompress(req.body.original);
    try {
      json5s.parse(originalJSON5);

      target = json5update(originalJSON5, target);
    } catch (e) {
    }
  }

  return res.json(answer.succ({
    data: crypto.compress(target)
  }));
});

/**
 * General form
 */
router.post(index.form.do, function (req, res, next) {
  var target = crypto.decompress(req.body.data);
  try {
    target = json5s.parse(target);
  } catch (e) {
    return res.json(answer.fail('invalid JSON target: ' + e.message));
  }

  res.render(index.form, {
    layout: false,
    form: forms.fromJSON(target)
  });
});
