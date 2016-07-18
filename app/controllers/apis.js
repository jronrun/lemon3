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
  Interface = app_require('models/api/interf');

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
 * API Request
 */
router.post(index.request.do, function (req, res, next) {
  if (req.anonymous) {
    return res.json(answer.resp(401));
  }

  requs.request({
      envId: req.body.env,
      groupId: req.body.group,
      servId: req.body.serv,
      apiId: req.body.api,
      requ: req.body.requ
    }, function(answer) {
      answer.result = crypto.compress(answer.result);
      return res.json(answer);
    }, req.user, {
      ip: req.ip
    }
  );
});

/**
 * API define
 */
router.post(index.define.do, function (req, res, next) {
  requs.apiDefine(req.body.params, function(answer) {
    answer.result = crypto.compress(answer.result);
    return res.json(answer);
  });
});

/**
 * API comment
 */
router.post(index.comment.do, function (req, res, next) {
  var params = req.body.params;
  requs.apiDefine(params, function(answer) {
    var aDef = answer.result.item;
    if (null != aDef) {
      var doc = [
        '/**',
        ' * API Document - ' + aDef.name,
        ' * ' + aDef.desc || '',
        ' */',
        crypto.decompress(aDef.request_doc)
      ].join('\n');
      answer.result = json5update(doc, params.requ);
    } else {
      answer.result = '';
    }
    answer.result = crypto.compress(answer.result);
    return res.json(answer);
  }, true);
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
    }, function(answer) {
      answer.result = crypto.compress(answer.result);
      return res.json(answer);
    }, req.user, {
      opt: 1
    }
  );
});

/**
 * Fill History Response
 */
router.post(index.history.do, function (req, res, next) {
  if (req.anonymous) {
    return res.json(answer.resp(401));
  }

  var hisId = parseInt(req.body.hisId), resp = req.body.resp;
  requs.setHisResp(hisId, resp, function() {
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
  requs.nextHistory(curHis, false, function(answer) {
    answer.result = crypto.compress(answer.result);
    return res.json(answer);
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
  requs.nextHistory(curHis, true, function(answer) {
    answer.result = crypto.compress(answer.result);
    return res.json(answer);
  });
});

/**
 * Query History
 */
router.post(index.history.query.do, function (req, res, next) {
  if (req.anonymous) {
    return res.json(answer.succ(crypto.compress({ items: [] })));
  }

  var query = {}, pn = parseInt(req.body.page || '1'), ps = false, key = req.body.key;
  if (key && key.length > 0) {
    var likeKey = new RegExp(key, 'i'), query = {
      $or:[
        { 'env.name': likeKey},
        { 'env.level': likeKey},
        { 'group.name': likeKey},
        { 'serv.name': likeKey},
        { 'serv.url': likeKey},
        { 'api.name': likeKey},
        { 'user.ip': likeKey},
        { 'user.name': likeKey}
      ]
    };
  } else if (req.body.query) {
    var paramQry = req.body.query;
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

  requs.qryHistory(query, pn, function (answer) {
    answer.result.userl = req.user.isAdmin ? 1 : 0;
    answer.result = crypto.compress(answer.result);
    return res.json(answer);
  }, ps, qryOpts);
});

/**
 * API Servers (Environment)
 */
router.post(index.servers.do, function (req, res, next) {
  if (req.anonymous) {
    return res.json(answer.succ({ envs: []}));
  }

  async.waterfall([
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
  if (req.anonymous) {
    return res.json(answer.succ({items: []}));
  }

  async.waterfall([
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
        }, items.serverOwnerQuery(req));
      }

      //Param Query
      var key = req.body.key;
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
          aGroup.interfs.push(requs.getRespAPI(interf));
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
