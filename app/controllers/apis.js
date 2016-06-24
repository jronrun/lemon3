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
    return res.json(answer.succ({ items: []}));
  }

  async.waterfall([
    function (callback) {
      Environment.find(items.envOwnerQuery(req)).sort({_id: -1}).toArray(function (err, items) {
        var envData = {}; _.each(items, function (item) {
          envData[item.id] = item;
        });

        items = _.orderBy(items, ['order', 'id'], ['desc', 'desc']);
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

        items = _.orderBy(items, ['order', 'id'], ['desc', 'desc']);
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

      Server.find(query).sort({
        env_id: -1,
        group_id: -1
      }).toArray(function (err, items) {
        callback(null, {
          env: envData,
          group: groupData,
          server: items || []
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
          desc: env.desc
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
    function(envData, callback) {
      Group.find(items.groupOwnerQuery(req)).sort({_id: -1}).toArray(function (err, items) {
        var groupData = {}; _.each(items, function (item) {
          groupData[item.id] = item;
        });

        callback(null, envData, groupData);
      });
    },
    function(envData, groupData, callback) {
      Interface.find(items.interfaceOwnerQuery(req)).sort({
        group_id: -1,
        id: -1
      }).toArray(function (err, items) {
        callback(null, {
          group: groupData,
          interf: items || []
        });
      });
    }
  ], function(err, result) {
    var interfs = [];
    _.each(result.interf, function (item) {
      var group = result.group[item.group_id];

      if (group) {
        var interf = {
          id: item.id,
          name: item.name,
          desc: item.desc,
          request: item.request,
          response: item.response,
          group: {
            id: group.id,
            name: group.name,
            desc: group.desc
          }
        };

        interfs.push(interf);
      }
    });

    return res.json(answer.succ({
      items: interfs
    }));
  });
});
