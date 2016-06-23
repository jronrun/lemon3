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
    return res.json(answer.succ({items: []}));
  }

  async.waterfall([
    function (callback) {
      Environment.find(items.envOwnerQuery(req)).sort({_id: -1}).toArray(function (err, items) {
        var envData = {};
        _.each(items, function (item) {
          envData[item.id] = item;
        });

        callback(null, envData);
      });
    },
    function(envData, callback) {
      Group.find(items.groupOwnerQuery(req)).sort({_id: -1}).toArray(function (err, items) {
        var groupData = {};
        _.each(items, function (item) {
          groupData[item.id] = item;
        });

        callback(null, envData, groupData);
      });
    },
    function(envData, groupData, callback) {
      var aSort = {
        env_id: -1,
        group_id: -1
      };

      Server.find(items.serverOwnerQuery(req)).sort(aSort).toArray(function (err, items) {
        callback(null, {
          env: envData,
          group: groupData,
          server: items || []
        });
      });
    }
  ], function(err, result) {
    var servers = [];

    return res.json(answer.succ({
      items: servers
    }));
  });
});

/**
 * API Interfaces (Which API)
 */
router.post(index.interfaces.do, function (req, res, next) {

});
