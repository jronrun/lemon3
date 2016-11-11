'use strict';

var express = require('express'),
  router = express.Router(),
  log = log_from('imports'),
  request = require('request'),
  index = routes.import;

module.exports = function (app) {
  app.use(index.action, router);
};

function swagger(target, resultCall) {
  if (isURL(target)) {
    var urlObj = nUrl.parse(target), swaggerResourceURL = '', respCode = null,
      urlBase = _.extend({}, urlObj, {
        hash: null,
        search: null,
        query: null,
        path: null,
        href: null,
        pathname: null
      }).format();

    //swagger-resources
    if (urlObj.pathname.indexOf('/swagger-resources') != -1) {
      respCode = 3;
      swaggerResourceURL = target;
    }
    //api-docs
    else if (urlObj.pathname.indexOf('/api-docs') != -1) {
      respCode = 0;
      swaggerResourceURL = target;
    }
    //swagger-ui.html || swagger ui doc url
    else {
      respCode = 3;
      swaggerResourceURL = _.extend({}, urlObj, {
        hash: null,
        search: null,
        query: null,
        path: null,
        href: null,
        pathname: 'swagger-resources'
      }).format();
    }

    request(swaggerResourceURL, function (error, response, body) {
      if (error) {
        return resultCall(answer.fail(error.message));
      }

      if (!response) {
        return resultCall(answer.fail('none response'));
      }

      if (response.statusCode != 200) {
        return resultCall(answer.fail('Http Error: http code ' + response.statusCode + ' ' + (response.body || '')));
      }

      var swaggerResource = null;
      try {
        swaggerResource = json5s.parse(body);
      } catch (e) {/**/}

      if (!swaggerResource) {
        return resultCall(answer.fail('parse data error: ' + body));
      }

      // api-docs?group=
      if (0 == respCode) {

      }
      // swagger-resources
      else if (3 === respCode) {
        /* [ {
           "name": "pay-trade",
           "location": "/v2/api-docs?group=pay-trade",
           "swaggerVersion": "2.0"
         } ] */

        if (swaggerResource.length < 1) {
          return resultCall(answer.fail('there is no swagger resource: ' + body));
        }

        _.each(swaggerResource, function (sr) {
          sr.location = urlBase + sr.location;
        });

        resultCall(answer.resp(respCode, swaggerResource));
      }
    });

  } else {
    var swaggerData = null;
    try {
      swaggerData = json5s.parse(target);
    } catch (e) {/**/}

    if (!swaggerData) {
      return resultCall(answer.fail('invalid swagger api docs data'));
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
