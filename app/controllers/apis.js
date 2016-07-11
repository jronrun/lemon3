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

      var pn = parseInt(req.body.page || '1'), ps = 3;
      Interface.page(query, pn, false, ps, {
        sorts: {
          group_order: 1,
          id: -1
        }
      }).then(function (result) {
        callback(null, {
          group: groupData,
          interf: result.items
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
          var aInterf = {
            id: interf.id,
            name: interf.name,
            desc: interf.desc,
            request: interf.request,
            response: interf.response,
            request_doc: interf.request_doc,
            response_doc: interf.response_doc
          };

          aGroup.interfs.push(aInterf);
        }
      });

      if (aGroup.interfs.length > 0) {
        items.push(aGroup);
      }
    });

    return res.json(answer.succ({
      items: items
    }));
  });
});
