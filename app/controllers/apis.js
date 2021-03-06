'use strict';

var express = require('express'),
  router = express.Router(),
  log = log_from('apis'),
  index = routes.api,

  items = require('../helpers/items'),
  apiRequest = require('../helpers/api_request'),
  Environment = app_require('models/api/env'),
  Group = app_require('models/api/group'),
  Server = app_require('models/api/server'),
  Interface = app_require('models/api/interf'),
  Power = app_require('models/power');

var requs = apiRequest();

module.exports = function (app) {
  app.use(index.action, router);
};

/**
 * APIs home
 */
router.get(index.do, function (req, res, next) {
  res.render(index);
});


/**
 * Navbar header, User Information
 */
router.post(index.header.do, function (req, res, next) {
  var indexData = {
    logined: false
  };

  if (!req.anonymous) {
    _.extend(indexData, {
      logined: true,
      username: req.user.name
    });
  }

  res.json(answer.succ(crypto.compress(indexData)));
});

/**
 * API Request
 */
router.post(index.request.do, function (req, res, next) {
  var requParse = deepParse(req.body.data), params = {};
  if (requParse.isFail()) {
    return res.json(requParse.target);
  }

  var params = requParse.get(), requestData = {
    envId: params.env,
    groupId: params.group,
    servId: params.serv,
    apiId: params.api,
    requ: params.requ,
    advance: {
      headers: params.advance.headers,
      params: params.advance.params
    }
  }, requestOptions = {
    ip: req.ip
  };

  requs.executeAPIShareSource({
    serv: requestData.servId,
    requ: requestData.requ,
    api: requestData.apiId
  }, params.source, function(shareAns) {
    var executable = ansWrap(shareAns);
    if (executable.isSucc()) {
      var shared = executable.get();
      req.user = items.grantExecutableShare(req.anonymous, req.user, shared);

      _.extend(requestOptions, {
        share: shared.share,
        checkGroup: 1
      });

      requs.request(requestData, function(requAns) {
        return res.json(ansEncode(requAns));
      }, requestInfo(req), requestOptions);
    } else {

      if (req.anonymous) {
        return res.json(answer.resp(401, {}, executable.failMsg()));
      }

      requs.request(requestData, function(requAns) {
        return res.json(ansEncode(requAns));
      }, requestInfo(req), requestOptions);
    }
  }, requestInfo(req));
});

/**
 * Get API define by ID
 */
router.post(index.definebyid.do, function (req, res, next) {
  if (req.anonymous) {
    return res.json(answer.fail('anonymous'));
  }

  var apiId = req.body.id, resSuccAns = function (aTarget) {
    return res.json(ansEncode(answer.succ(requs.getRespAPI(aTarget, req.user))));
  };
  Interface.find({id: parseInt(apiId)}).limit(1).next(function(err, anInterf){
    if (err) {
      return res.json(answer.fail(err.message));
    }

    if (!anInterf) {
      return res.json(answer.fail('none exist ' + apiId));
    }

    if (anInterf.create_by.id != req.user.id) {
      Power.hasInnerPower('PUBLIC_RETRIEVE', function (hasPublicRetrieve) {
        if (!hasPublicRetrieve || 1 !== anInterf.owner) {
          return res.json(answer.fail('no authority'));
        }

        return resSuccAns(anInterf);
      }, req.user);
    } else {
      return resSuccAns(anInterf);
    }
  });
});

/**
 * API define
 */
router.post(index.define.do, function (req, res, next) {
  var params = _.extend(req.body.params || {}, {
    getHostIfMutation: 1
  });

  requs.apiDefine(params, function(defineAns) {
    return res.json(ansEncode(defineAns));
  }, false, req.user);
});

router.post(index.settings.do, function (req, res, next) {
  var paramsParse = deepParse(req.body.params);
  if (paramsParse.isFail()) {
    return res.json(paramsParse.target);
  }

  var warnMsg = 'There is no authority for setting-up interface',
    keyBatch = '$batch$', keySetting = '$setting$', keySingle = '$single$', aData = _.extend({
    apiId: 0,
    update: null
  }, paramsParse.get() || {});

  async.waterfall([
    function (callback) {
      requs.isExecutableAPIShareSource(req.body.source, function(shareAns) {
        var executable = ansWrap(shareAns);
        if (executable.isSucc()) {
          req.user = items.grantExecutableShare(req.anonymous, req.user, executable.get());
          callback(null);
        } else {
          if (req.anonymous) {
            return res.json(answer.fail(warnMsg));
          }

          callback(null);
        }
      }, requestInfo(req));
    },
    function(callback) {
      if (!items.ownInterface(req.user, aData.apiId)) {
        return res.json(answer.fail(warnMsg));
      }

      Interface.find({id: aData.apiId}).limit(1).next(function(err, anInterf){
        if (err) {
          return res.json(answer.fail(err.message));
        }

        if (!anInterf) {
          return res.json(answer.fail('API none exist ' + aData.apiId));
        }

        if (anInterf.create_by.id != req.user.id) {
          Power.hasInnerPower('PUBLIC_RETRIEVE', function (hasPublicRetrieve) {
            if (!hasPublicRetrieve || 1 !== anInterf.owner) {
              return res.json(answer.fail(warnMsg));
            }

            callback(null, anInterf);
          }, req.user);
        } else {
          callback(null, anInterf);
        }
      });
    },
    function (target, callback) {
      //interface config update
      if (aData.update) {
        Power.hasInnerPower('PUBLIC_UPDATE', function (hasPublicUpdate) {
          if (!hasPublicUpdate && target.create_by.id != req.user.id) {
            return res.json(answer.fail(warnMsg));
          }

          var hasB = _.has(aData.update, keyBatch), hasS = _.has(aData.update, keySetting);
          if (!hasB && !hasS) {
            return res.json(answer.fail('Invalid params to set batch request ' + aData.apiId));
          }

          var updateD = {}, singleD = {};
          target.settings = target.settings || {};
          target.settings.batches = target.settings.batches || {};
          target.settings.single = target.settings.single || {};

          if (hasB) {
            updateD.batch = _.extend({
              param_name: '',
              values: ''
            }, target.settings.batches.batch || {}, aData.update[keyBatch]);
          }

          if (hasS) {
            updateD.setting = _.extend({
              interval: 300,
              request: 0,
              response: 1,
              query: null
            }, target.settings.batches.setting || {}, aData.update[keySetting]);

            updateD.setting.query = crypto.compress(updateD.setting.query);
          }

          if (_.has(aData.update, keySingle)) {
            singleD = _.extend({
              field: 1,
              comment: null,
              query: null
            }, target.settings.single || {}, aData.update[keySingle]);
            singleD.query = crypto.compress(singleD.query);
            if (singleD.comment) {
              if (1 != singleD.comment) {
                if (!_.isString(singleD.comment) || singleD.comment.indexOf('|') === -1) {
                  return res.json(answer.fail('$single$.comment is not a valid string'));
                }

                var cArr = singleD.comment.split('|');
                if (cArr[0] === cArr[1]) {
                  return res.json(answer.fail('$single$.comment must provide different values besides of "|"'));
                }
              }
            }
          }

          Interface.findOneAndUpdate(
            {_id: target._id},
            {
              $set: {
                settings: {
                  batches: updateD,
                  single: singleD
                }
              }
            },
            {upsert: true, returnOriginal: false},
            function (err, doc) {
              if (err) {
                return res.json(answer.fail(err.message));
              }

              //end for update
              return res.json(ansEncode(answer.succ()));
            }
          );
        }, req.user);
      } else {
        //continue get
        callback(null, target);
      }
    },
    function (target, callback) {
      var batchCfg = [
        '/** Setting-up for ' + target.name + ' */',
        '{',
          '//Batch Request - Parameters',
          '$batch$: {',
            "param_name: '',",
            '//Split with comma ","',
            "values: ''",
          '},',
          '//Batch Request - Settings',
          '$setting$: {',
            '//Request interval (ms)',
            'interval: 300,',
            '//In Result: 0 short, 1 full, [] Field Array',
            '//Field eg: da[0].id, or rename as uid: da[0].id|uid',
            'request: 0,',
            '//In Result: 1 full, [] Field Array',
            'response: 1,',
            '//Query result (Mongo Style)',
            'query: null',
          '},',
          '//Single Request',
          '$single$: {',
            '//In Result: 1 full, [] Field Array',
            'field: 1,',
            "//Comments (see below)",
            'comment: null,',
            '//Query result (Mongo Style)',
            'query: null',
          '},',
        '}',
        '/**',
        '  Setting-up $batch$',
        '    1. Config same filed with different values with Object',
        "  { param_name: 'data.field', values: '1,2,3' }",
        '    2. Config different filed and multi-field with Array',
        "  [ { 'test.field1': 'test', 'data.field2': 12 } ]",
        '\n',
        '  Setting-up $single$.comment',
        "  a. set 1 then update result to defined API response, eg: {comment: 1}",
        "  b. set string ${value field}|${comment field} or string array",
        "    Result eg: {desc: {name: 'User Name'}, value: {name: 'jack', passwd: ''}}",
        "    then config is {comment: 'value|desc'} or {comment: ['value|desc']}",
        "    value from result, desc from result or defined API response",
        "    value and desc must have a different value",
        '\n',
        '  Query Final Result - Mongo Style',
        '    1. Supported operators: $in, $nin, $exists, $gte, $gt, $lte, $lt, $eq, $ne, $mod, $all, $and, $or,' +
        ' $nor, $not, $size, $type, $regex, $where, $elemMatch',
        '    2. Regexp searches',
        '    3. sub object searching',
        '    4. dot notation searching',
        '*/'
      ].join('\n');

      var aResult = null;
      if (_.has(target, 'settings')) {
        var updateData = {}, aRespApi = requs.getRespAPI(target);

        if (_.has(aRespApi.settings, 'batches')) {
          var aBatchCfg = aRespApi.settings.batches;
          if (_.has(aBatchCfg, 'batch')) {
            updateData[keyBatch] = _.extend({
              param_name: '',
              values: ''
            }, aBatchCfg.batch || {});
          }

          if (_.has(aBatchCfg, 'setting')) {
            updateData[keySetting] = _.extend({
              interval: 300,
              request: 0,
              response: 1,
              query: null
            }, aBatchCfg.setting || {});
          }
        }

        var aSingleCfg = {
          field: 1,
          comment: null,
          query: null
        };

        if (_.has(aRespApi.settings, 'single')) {
          _.extend(aSingleCfg, aRespApi.settings.single || {});
        }
        updateData[keySingle] = aSingleCfg;

        aResult = json5update(batchCfg, updateData);
      } else {
        aResult = batchCfg;
      }

      callback(null, aResult);
    }
  ], function(err, result) {
    return res.json(ansEncode(answer.succ(result)));
  });

});

/**
 * API Batch Configuration
 */
router.post(index.batch.do, function (req, res, next) {
  var paramsParse = deepParse(req.body.params);
  if (paramsParse.isFail()) {
    return res.json(paramsParse.target);
  }

  var params = paramsParse.get(), batchCfg = '', hasPrevCfg = false;
  if (!(hasPrevCfg = params.prev)) {
    batchCfg = [
      '/** Batch Request Configuration  */',
      '{',
        '$batch$: {',
          "param_name: '',",
          '//Split with comma ","',
          "values: ''",
        '},',
        '//Prototype of Request API',
        '$request$: {},',
        '$setting$: {',
          '//Request interval (ms)',
          'interval: 300,',
          '//In Result: 0 short, 1 full, [] Field Array',
          '//Field eg: da[0].id, or rename as uid: da[0].id|uid',
          'request: 0,',
          '//In Result: 1 full, [] Field Array',
          'response: 1,',
          '//Query result (Mongo Style Query)',
          'query: null',
        '}',
      '}',
      '/**',
      '  Configuration $batch$',
      '    1. Config same filed with different values with Object',
      "  { param_name: 'data.field', values: '1,2,3' }",
      '    2. Config different filed and multi-field with Array',
      "  [ { 'test.field1': 'test', 'data.field2': 12 } ]",
      '\n',
      '  Query Final Result - Mongo Style',
      '    1. Supported operators: $in, $nin, $exists, $gte, $gt, $lte, $lt, $eq, $ne, $mod, $all, $and, $or,' +
      ' $nor, $not, $size, $type, $regex, $where, $elemMatch',
      '    2. Regexp searches',
      '    3. sub object searching',
      '    4. dot notation searching',
      '*/'
    ].join('\n');
  } else {
    batchCfg = params.prev;
  }

  var updateData = json5s.parse(batchCfg), aResult = null;
  updateData['$request$'] = params.requ;

  if (!hasPrevCfg) {
    requs.apiDefine(params, function(defineAns) {
      var aDef = defineAns.result.item;
      if (null != aDef && _.has(aDef, 'settings') && _.has(aDef.settings, 'batches')) {
        var aBatchCfg = aDef.settings.batches || {}, keyBatch = '$batch$', keySetting = '$setting$';
        if (_.has(aBatchCfg, 'batch')) {
          updateData[keyBatch] = _.extend({
            param_name: '',
            values: ''
          }, aBatchCfg.batch || {});
        }

        if (_.has(aBatchCfg, 'setting')) {
          updateData[keySetting] = _.extend({
            interval: 300,
            request: 0,
            response: 1,
            query: null
          }, aBatchCfg.setting || {});
        }
      }

      aResult = json5s.format(json5update(batchCfg, updateData));
      return res.json(ansEncode(answer.succ(aResult)));
    }, true, req.user);
  } else {
    aResult = json5s.format(json5update(batchCfg, updateData));
    return res.json(ansEncode(answer.succ(aResult)));
  }
});

/**
 * API comment
 */
router.post(index.comment.do, function (req, res, next) {
  var paramsParse = deepParse(req.body.params);
  if (paramsParse.isFail()) {
    return res.json(paramsParse.target);
  }

  var params = paramsParse.get();
  requs.apiDefine(params, function(defineAns) {
    var aDef = defineAns.result.item;
    if (null != aDef) {
      var doc = [
        '/**',
        ' * API - ' + (2 == aDef.mutation ? 'Mutation of ' : '') + aDef.name,
        ' * ' + aDef.desc || '',
        ' */'
      ];

      var complex = defineAns.result.complex;
      if (complex && complex.length > 0) {
        doc.push('{\n"' + complex + '": ' + crypto.decompress(aDef.request_doc) + "\n}");
      } else {
        doc.push(crypto.decompress(aDef.request_doc));
      }

      var aResult = json5update(doc.join('\n'), params.requ);
      defineAns.result = json5s.format(aResult);
    } else {
      defineAns.result = '';
    }

    return res.json(ansEncode(defineAns));
  }, true, req.user);
});

/**
 * API View URL
 */
router.post(index.viewurl.do, function (req, res, next) {
  var requ = crypto.decompress(req.body.requ);
  try {
    requ = convertData(json5s.parse(requ));
  } catch (e) {
    return res.json(answer.fail('invalid request data: ' + e.message));
  }

  if (req.anonymous) {
    return res.json(answer.succ(crypto.compress({
      path: '',
      data: requ
    })));
  }

  requs.request({
      envId: req.body.env,
      groupId: req.body.group,
      servId: req.body.serv,
      requ: req.body.requ
    }, function(requAns) {
      return res.json(ansEncode(requAns));
    }, requestInfo(req), {
      opt: 1
    }
  );
});

/**
 * Fill History Response
 */
router.post(index.history.do, function (req, res, next) {
  var hisId = parseInt(req.body.hisId), resp = req.body.resp;

  requs.isExecutableAPIShareSource(req.body.source, function(shareAns) {
    var executable = ansWrap(shareAns);
    if (executable.isSucc()) {
      requs.setHisResp(hisId, resp, function() {
        return res.json(answer.succ());
      });
    } else {
      if (req.anonymous) {
        return res.json(answer.resp(401));
      }

      requs.setHisResp(hisId, resp, function() {
        return res.json(answer.succ());
      });
    }
  }, requestInfo(req));

});

/**
 * History note
 */
router.post(index.history.note.do, function (req, res, next) {
  if (req.anonymous) {
    return res.json(answer.resp(401));
  }

  var hisId = parseInt(req.body.hisId), note = req.body.note;
  requs.setHisNote(hisId, note, function() {
    return res.json(answer.succ());
  });
});

/**
 * Next History
 */
router.post(index.history.next.do, function (req, res, next) {
  if (req.anonymous) {
    return res.json(answer.succ(crypto.compress({ item: null })));
  }

  var curHis = parseInt(req.body.curHis);
  requs.nextHistory(curHis, false, function(nextHisAns) {
    return res.json(ansEncode(nextHisAns));
  });
});

/**
 * Previous History
 */
router.post(index.history.prev.do, function (req, res, next) {
  if (req.anonymous) {
    return res.json(answer.succ(crypto.compress({ item: null })));
  }

  var curHis = parseInt(req.body.curHis);
  requs.nextHistory(curHis, true, function(nextHisAns) {
    return res.json(ansEncode(nextHisAns));
  });
});

/**
 * Query History
 */
router.post(index.history.query.do, function (req, res, next) {
  var noneQueryResult = answer.succ(crypto.compress({ items: [] }));
  if (req.anonymous) {
    return res.json(noneQueryResult);
  }

  var query = {}, pn = parseInt(req.body.page || '1'), ps = false,
    key = req.body.key, mutation = req.body.mutation;
  if (mutation) {
    _.extend(query, {
      'api.mutation': parseInt(mutation)
    })
  }

  if (key && key.length > 0) {
    var likeKey = new RegExp(key, 'i'), query = {
      $or:[
        { 'env.name': likeKey},
        { 'env.level': likeKey},
        { 'group.name': likeKey},
        { 'serv.name': likeKey},
        { 'serv.url': likeKey},
        { 'api.name': likeKey},
        { 'api.desc': likeKey},
        { 'user.ip': likeKey},
        { 'user.name': likeKey},
        { note: likeKey}
      ]
    };
  } else if (req.body.query) {
    var queryParse = deepParse(req.body.query);
    if (queryParse.isFail()) {
      noneQueryResult.msg = queryParse.failMsg();
      return res.json(noneQueryResult);
    }

    var paramQry = queryParse.get();
    if (paramQry.env && paramQry.env.length > 0) {
      _.extend(query, {
        'env.id': parseInt(paramQry.env)
      });
    }

    if (paramQry.group && paramQry.group.length > 0) {
      _.extend(query, {
        'group.id': parseInt(paramQry.group)
      });
    }

    if (paramQry.body) {
      if (paramQry.body.name && paramQry.body.name.length > 0) {
        var nameQry = new RegExp(paramQry.body.name, 'i');
        _.extend(query, {
          $or: [
            {'serv.name': nameQry},
            {'serv.url': nameQry}
          ]
        })
      }

      if (paramQry.body.request) {
        var requQry = reverseData({
          api: {
            request: paramQry.body.request
          }
        });

        _.each(requQry, function (v, k) {
          query[k] = _.isString(v) ? new RegExp(v, 'i') : v;
        });
      }

      if (paramQry.body.response) {
        var respQry = reverseData({
          api: {
            response: paramQry.body.response
          }
        });

        _.each(respQry, function (v, k) {
          query[k] = _.isString(v) ? new RegExp(v, 'i') : v;
        });
      }
    }
  }

  var qryOpts = { fields: { _id: 0}};
  if (!req.user.isAdmin) {
    _.extend(query, {
      'user.id': req.user.id
    });
    _.extend(qryOpts.fields, {
      user: 0
    });
  }

  requs.qryHistory(query, pn, function (qryHisAns) {
    qryHisAns.result.userl = req.user.isAdmin ? 1 : 0;
    return res.json(ansEncode(qryHisAns));
  }, ps, qryOpts);
});

/**
 * API Servers (Environment)
 */
router.post(index.servers.do, function (req, res, next) {
  async.waterfall([
    function (callback) {
      requs.isExecutableAPIShareSource(req.body.source, function(shareAns) {
        var executable = ansWrap(shareAns);
        if (executable.isSucc()) {
          req.user = items.grantExecutableShare(req.anonymous, req.user, executable.get());
          callback(null);
        } else {
          if (req.anonymous) {
            return res.json(answer.succ({ envs: []}));
          }

          callback(null);
        }
      }, requestInfo(req));
    },
    function (callback) {
      Environment.find(items.envOwnerQuery(req)).sort({_id: -1}).toArray(function (err, items) {
        var envData = {}; _.each(items, function (item) {
          envData[item.id] = item;
        });

        items = _.orderBy(items, ['order', 'id'], ['asc', 'desc']);
        var sort = []; _.each(items, function (v) {
          sort.push(v.id);
        });
        envData.sort = sort;

        callback(null, envData);
      });
    },
    function(envData, callback) {
      Group.find(items.groupOwnerQuery(req)).sort({_id: -1}).toArray(function (err, items) {
        var groupData = {}; _.each(items, function (item) {
          groupData[item.id] = item;
        });

        items = _.orderBy(items, ['order', 'id'], ['asc', 'desc']);
        var sort = []; _.each(items, function (v) {
          sort.push(v.id);
        });
        groupData.sort = sort;

        callback(null, envData, groupData);
      });
    },
    function(envData, groupData, callback) {
      var query = {};
      if (!req.user.isAdmin) {
        query = _.extend({
          env_id: {
            $in: envData.sort
          },
          group_id: {
            $in: groupData.sort
          }
        }, items.serverOwnerQuery(req));
      }

      var pn = parseInt(req.body.page || '1'), ps = false;
      Server.page(query, pn, false, ps, {
        sorts: {
          env_order: 1,
          group_order: 1,
          id: -1
        }
      }).then(function (result) {
        callback(null, {
          env: envData,
          group: groupData,
          server: result.items || []
        });
      });
    }
  ], function(err, result) {
    /*
    envs: [
      {
        info: {},
        groups: [
          {
            info: {},
            servs: []
          }
        ]
      }
    ]
     */
    var envs = [];

    _.each(result.env.sort, function (envId) {
      var env = result.env[envId];

      var aEnv = {
        info: {
          id: env.id,
          name: env.name,
          desc: env.desc,
          level: env.alert_level
        },
        groups: []
      };
      _.each(result.group.sort, function (groupId) {
        var group = result.group[groupId];

        var aGroup = {
          info: {
            id: group.id,
            name: group.name,
            desc: group.desc
          },
          servs: []
        };

        _.each(result.server, function (serv) {
          if (serv && envId == serv.env_id && groupId == serv.group_id) {
            var aServer = {
              id: serv.id,
              grant: (isURL(serv.home_url || '') ? crypto.compress(serv.home_url) : ''),
              jsonp: 'JSONP' === serv.request.method,
              name: serv.name,
              desc: serv.desc
            };

            aGroup.servs.push(aServer);
          }
        });

        if (aGroup.servs.length > 0) {
          aEnv.groups.push(aGroup);
        }
      });

      if (aEnv.groups.length > 0) {
        envs.push(aEnv);
      }
    });

    return res.json(answer.succ({ envs: envs}));
  });
});

/**
 * API Interfaces (Which API)
 */
router.post(index.interfaces.do, function (req, res, next) {
  async.waterfall([
    function (callback) {
      requs.isExecutableAPIShareSource(req.body.source, function(shareAns) {
        var executable = ansWrap(shareAns);
        if (executable.isSucc()) {
          req.user = items.grantExecutableShare(req.anonymous, req.user, executable.get());
          callback(null);
        } else {
          if (req.anonymous) {
            return res.json(answer.succ({items: []}));
          }

          callback(null);
        }
      }, requestInfo(req));
    },
    function(callback) {
      Group.find(items.groupOwnerQuery(req)).sort({_id: -1}).toArray(function (err, items) {
        var groupData = {}; _.each(items, function (item) {
          groupData[item.id] = item;
        });

        items = _.orderBy(items, ['order', 'id'], ['asc', 'desc']);
        var sort = []; _.each(items, function (v) {
          sort.push(v.id);
        });
        groupData.sort = sort;

        callback(null, groupData);
      });
    },
    function(groupData, callback) {
      var query = {};
      if (!req.user.isAdmin) {
        query = _.extend({
          group_id: {
            $in: groupData.sort
          }
        }, items.interfaceOwnerQuery(req));
      }

      //Param Query
      var key = req.body.key, mutation = req.body.mutation;
      if (mutation) {
        _.extend(query, {
          mutation: parseInt(mutation)
        });
      }

      if (key && key.length > 0) {
        var likeKey = new RegExp(key, 'i'), paramQry = {
          $or:[
            { name: likeKey},
            { desc: likeKey}
          ]
        };

        //https://docs.mongodb.com/manual/reference/operator/query/and/#op._S_and
        query = {
          $and: [
            query,
            paramQry
          ]
        }
      }

      var pn = parseInt(req.body.page || '1'), ps = false;
      Interface.page(query, pn, false, ps, {
        sorts: {
          group_order: 1,
          name: 1,
          id: -1
        }
      }).then(function (result) {
        callback(null, {
          group: groupData,
          interf: result.items,
          hasNext: result.page.hasNext
        });
      });
    }
  ], function(err, result) {
    var items = [];

    _.each(result.group.sort, function (groupId) {
      var group = result.group[groupId];

      var aGroup = {
        info: {
          id: group.id,
          name: group.name,
          desc: group.desc
        },
        interfs: []
      };

      _.each(result.interf, function (interf) {
        if (interf && groupId == interf.group_id) {
          aGroup.interfs.push(requs.getRespAPI(interf, req.user));
        }
      });

      if (aGroup.interfs.length > 0) {
        items.push(aGroup);
      }
    });

    return res.json(answer.succ({
      items: items,
      hasNext: result.hasNext
    }));
  });
});
