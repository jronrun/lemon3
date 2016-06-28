'use strict';

var express = require('express'),
  router = express.Router(),
  log = log_from('apis'),
  index = routes.api,

  items = require('../helpers/items'),
  Environment = app_require('models/api/env'),
  Group = app_require('models/api/group'),
  Server = app_require('models/api/server'),
  Interface = app_require('models/api/interf');

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

      var pn = parseInt(req.param('page') || '1'), ps = 12;
      Server.page(query, pn, false, ps, {
        sorts: {
          env_id: -1,
          group_id: -1
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
              desc: serv.desc,
              url: serv.url,
              request: serv.request
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

      var pn = parseInt(req.param('page') || '1'), ps = 10;
      Interface.page(query, pn, false, ps, {
        sorts: {
          group_id: -1,
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
