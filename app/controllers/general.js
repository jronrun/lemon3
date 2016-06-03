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
 * General form
 */
router.post(index.form.do, function (req, res, next) {
  var target = crypto.decompress(req.body.data);
  try {
    target = JSON.parse(target);
  } catch (e) {
    return res.json(answer.fail('invalid JSON target: ' + e.message));
  }

  var json = {
    "cmd": "M000930",
    "userId": "0",
    "token": "asdfasdfjal;dsfjka;lsdjf",
    "version": "1.0.0",
    "data": {
      "calltype": "2",
      "nest": {
        "nest1": 'test',
        child: {
          "nest2": 'test2',
          child: {
            "nest3": 'test3'
          }
        }
      },
      "maintain": {
        "test": [
          "abc",
          "efg"
        ],
        "title": [
          1,
          2,
          3
        ],
        "notice": [
          false,
          true
        ],
        "items": [
          {
            "type": "3",
            "start": "2015-12-13 00:00:00",
            "end": "2016-12-13 10:10:00",
            "title": "test aa",
            "notice": "weihu lalal"
          },
          {
            "type": "44",
            "start": "2014-12-13 00:00:00",
            "end": "2016-14-13 10:10:00",
            "title": "test 444aa",
            "notice": "weihu 444lalal"
          }
        ]
      }
    }
  };

  res.render(index.form, {
    layout: false,
    form: forms.fromJSON(json)
  });
});
