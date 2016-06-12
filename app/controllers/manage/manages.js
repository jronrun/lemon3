'use strict';

var express = require('express'),
  router = express.Router(),
  log = log_from('manage'),
  index = routes.manage;

module.exports = function (app) {
  app.use(index.action, router);

  require('./inherit/musers')(router, index.users, index);
  require('./inherit/powers')(router, index.powers, index);
  require('./inherit/api_powers')(router, index['api-power'], index);
  require('./inherit/roles')(router, index.roles, index);
  require('./inherit/sourcetree')(router, index.resource, index);

  require('./inherit/envs')(router, index.env, index);
  require('./inherit/groups')(router, index.group, index);
  require('./inherit/servers')(router, index.server, index);
  require('./inherit/interfs')(router, index.interface, index);
  require('./inherit/histories')(router, index.history, index);
};

/**
 * Manage home
 */
router.get(index.do, function (req, res, next) {
  var usr = req.user;
  res.render(index, {
    username: usr.name,
    menus: getUserMenu(usr.resource)
  });
});

/**
 * Dashboard
 */
router.get(index.dashboard.do, function (req, res, next) {
  res.render(index.dashboard, {
    pagename: 'dashboard-page'
  });
});


