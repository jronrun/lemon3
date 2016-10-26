'use strict';

var express = require('express'),
  router = express.Router(),
  log = log_from('imports'),
  index = routes.import;

module.exports = function (app) {
  app.use(index.action, router);
};

function swagger(target, resultCall) {
  if (isURL(target)) {
    //swagger-resources
    if (target.indexOf('/swagger-resources') != -1) {

    }
    //api-docs
    else if (target.indexOf('/api-docs') != -1) {

    }
    //swagger-ui.html || swagger ui doc url
    else {

    }

  } else {
    var swaggerData = null;
    try {
      swaggerData = json5s.parse(target);
    } catch (e) {/**/}
    if (!swaggerData) {
      return resultCall(answer.fail('Invalid swagger api docs data'));
    }
  }
}

function swaggerAnalyst(swaggerData, resultCall) {

}

function curl(target, resultCall) {

}

/**
 * Import Home
 */
router.get(index.do, function (req, res, next) {
  res.render(index);
});

/**
 * Import Resource Analyst
 * type: 1 swagger ('swagger-ui.html' | 'swagger-resources' | 'api-docs?group=' | {api-docs data} | {swagger url}),
 *       2 curl
 */
router.post(index.analyst.do, function (req, res, next) {
  var requParse = deepParse(req.body.data), params = null;
  if (requParse.isFail()) {
    return res.json(requParse.target);
  }

  params = requParse.get();
  switch (params.type) {
    case 1:
      return swagger(params.val, function (swaggerAns) {
        return res.json(ansEncode(swaggerAns));
      });
    case 2:
      return curl(params.val, function (curlAns) {
        return res.json(ansEncode(curlAns));
      });
  }

  return res.json(answer.fail('Unknown import resource'))
});
