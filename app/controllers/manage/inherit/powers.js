'use strict';

var Power = app_require('models/power'),
  log = log_from('powers');

module.exports = function (router, index) {
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

  /**
   * Power create
   */
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
};

