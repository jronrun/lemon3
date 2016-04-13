'use strict';

var express = require('express'),
  router = express.Router(),
  log = log_from('manage'),
  Power = app_require('models/power'),
  index = routes.manage;

module.exports = function (app) {
  app.use(index.action, router);
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

/**
 * Power list
 */
router.get(index.powers.do, function (req, res, next) {
  res.render(index.powers.page, {
    pagename: 'items-list-page',
    pageedit: index.powers.editor.action
  });
});

/**
 * Power editor
 */
router.get(index.powers.editor.do, function (req, res, next) {
  res.render(index.powers.editor.page, {
    pagename: 'item-editor-page',
    schema: Power.desc(['resources'], true),
    res_tab: 1,
    desc: 'Power',
    method: HttpMethod.POST,
    action: index.powers.editor.action,
    listAction: index.powers.action
  });
});

router.post(index.powers.editor.do, function (req, res, next) {
  var item = crypto.decompress(req.body.item);
  try {
    item = JSON.parse(item);
  } catch (e) {
    return res.json(answer.fail('invalid item: ' + e.message));
  }

  item.resources = req.body.resource || [];
  item.create_time = new Date();

  async.waterfall([
    function(callback) {
      Power.nextId(function (id) {
        item.id = id;

        var check = Power.validate(item);
        if (!check.valid) {
          return res.json(answer.fail(check.msg));
        }

        callback(null, item);
      });
    },
    function(power, callback) {
      Power.find({name: power.name}).limit(1).next(function(err, exists){
        if (exists) {
          return res.json(answer.fail('The name ' + power.name + ' already exist.'));
        }
        callback(null, item);
      });
    },
    function(power, callback) {
      Power.insertOne(power, function(err, result) {
        if (err) {
          return res.json(answer.fail(err.message));
        }

        if (1 != result.insertedCount) {
          return res.json(answer.fail('Create fail, Try again?'));
        }

        callback(null, result);
      });
    }
  ], function(err, result) {
    return res.json(answer.succ({}, 'Create success.'));
  });
});

/**
 * Whole resource tree
 */
router.post(index.resource.do, function (req, res, next) {
  res.render(index.resource, {
    nodes: getResourceTree()
  })
});

router.post(index.resource.power.do, function (req, res, next) {

});

router.post(index.resource.role.do, function (req, res, next) {

});

router.post(index.resource.user.do, function (req, res, next) {

});
