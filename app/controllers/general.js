'use strict';

var express = require('express'),
  router = express.Router(),
  log = log_from('general'),
  qs = require('qs'),
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
 * Update JSON5
 */
router.post(index.update5.do, function (req, res, next) {
  var paramsParse = deepParse(req.body.params);
  if (paramsParse.isFail()) {
    return res.json(paramsParse.target);
  }

  var params = _.extend({
    source: null,
    value: null,
    format: 1
  }, paramsParse.get());

  if (!params.source || !params.value) {
    return res.json(answer.fail('invalid parameters'));
  }

  var asStr = function (aTarget) {
    if (!_.isString(aTarget)) {
      aTarget = json5s.stringify(aTarget);
    }
    json5s.parse(aTarget);
    if (1 === params.format) {
      aTarget = json5s.format(aTarget);
    }

    return aTarget;
  };

  try {
    params.source = asStr(params.source);

    if (!_.isString(params.value)) {
      params.value = json5s.stringify(params.value);
    }
    params.value = json5s.parse(params.value);

    var aResult = json5update(params.source, params.value);
    return res.json(ansEncode(answer.succ(aResult)));
  } catch (e) {
    return res.json(answer.fail('invalid parameters ' + e.message));
  }
});

/**
 * Add Comment to JSON
 */
router.post(index.addcomment.do, function (req, res, next) {
  var paramsParse = deepParse(req.body.params);
  if (paramsParse.isFail()) {
    return res.json(paramsParse.target);
  }

  var params = _.extend({
    //Both value & desc obj, or just value obj
    data: {},
    commentData: {},
    valueField: '',
    commentField: '',
    //type 1 /** example */, 2 // example
    type: 2
  }, paramsParse.get());

  var commentD = _.get(params.commentData, params.commentField);
  if (!commentD) {
    commentD = _.get(params.data, params.commentField);
    if (commentD) {
      _.unset(params.data, params.commentField);
    }
  }
  commentD = _.cloneDeep(commentD || {});

  var tokens = json5s.tokenize(json5s.format(json5s.stringify(params.data))),
    keyPrefix = params.valueField + '.', aResult = '';
  _.each(tokens, function (token, idx) {
    switch (token.type) {
      case 'key':
        var theProp = token.raw, theComm = null;
        if (token.stack.length > 0) {
          var keys = _.slice(token.stack);
          keys.push(token.raw);
          theProp = keys.join('.');
          theProp = theProp.replace(keyPrefix, '');
        }

        if (theComm = _.get(commentD, theProp)) {
          if (_.isString(theComm)) {
            if (1 == params.type) {
              aResult += ('/** ' + theComm + ' */\n');
            } else if (2 == params.type) {
              aResult += ('// ' + theComm + '\n');
            }

            var prev = tokens[idx - 1];
            if (prev && 'whitespace' === prev.type) {
              aResult += prev.raw;
            }
          }
        }

        aResult += token.raw;
        break;
      default:
        aResult += token.raw;
        break;
    }
  });

  return res.json(ansEncode(answer.succ(aResult)));
});

/**
 * Convert Query String As JSON
 * https://github.com/ljharb/qs
 */
router.post(index.convertqs.do, function (req, res, next) {
  var target = crypto.decompress(req.body.data);

  var prefix = '';
  if (target && target.length > 0 && isURL(target)) {
    var urlcom = target.split('?');
    if (urlcom.length > 1) {
      prefix = urlcom[0];
      target = urlcom[1];
    } else {
      prefix = urlcom[0];
      target = '';
    }
  }

  var aResult = [], parsed = {};
  if (target && target.length > 0) {
    parsed = qs.parse(target, {
      delimiter: /[;,&]/,
      allowDots: false,
      plainObjects: true,
      depth: 100,
      arrayLimit: 1000,
      parseArrays: true,
      parameterLimit: 10000
    });

    var parseNest = function(aObj) {
      _.each(aObj, function (v, k) {
        if (_.isString(v) && v.indexOf('{') != -1 && v.indexOf('}') != -1) {
          try {
            aObj[k] = json5s.parse(v);
          } catch (e) {

          }
        }

        if (_.isObject(v) && !_.isArray(v)) {
          parseNest(v);
        }
      });
    };

    parseNest(parsed);
  }

  if (prefix.length > 0) {
    aResult.push('// ' + prefix);
  }
  aResult.push(JSON.stringify(parsed));

  return res.json(answer.succ({
    parsed: aResult.join('\n')
  }))
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
