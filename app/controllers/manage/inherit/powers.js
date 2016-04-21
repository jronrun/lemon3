'use strict';

var Power = app_require('models/power'),
  items = app_require('helpers/items'),
  log = log_from('powers');

module.exports = function (router, index) {
  /**
   * Power list
   */
  router.get(index.do, function (req, res, next) {
    var defines = [
      {
        title: 'Name',
        prop: function(item) {
          var html = [
            '<a href="item-editor.html" class=""><h4 class="item-title">',
              item.name,
            '</h4></a>'
            ];
          return html.join('');
        },
        clazz: 'fixed pull-left item-col-title'
      },
      {
        title: 'Description',
        prop: 'desc',
        clazz: 'item-col-sales'
      },
      {
        title: 'Create',
        prop: 'create_time',
        clazz: 'item-col-date',
        type: 'date'
      }
    ];

    Power.page({}, req.params.page, false, 2).then(function (result) {
      res.render(index.page, {
        pagename: 'items-list-page',
        pageedit: index.editor.action,
        list: items.asShowData(defines, result.items),
        page: result.page,
        action: actionWrap(index.action).base,
        retrieveAction: actionWrap(index.retrieve.action).base
      });
    });

  });

  /**
   * Power editor
   */
  router.get(index.editor.do, function (req, res, next) {
    res.render(index.editor.page, {
      pagename: 'item-editor-page',
      schema: Power.desc(['resources'], true),
      res_tab: 1,
      desc: 'Power',
      method: HttpMethod.POST,
      action: index.editor.action,
      listAction: actionWrap(index.action, 1).action
    });
  });

  /**
   * Power create
   */
  router.post(index.editor.do, function (req, res, next) {
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

  router.delete(index.retrieve.do, function (req, res, next) {
    log.info(req.params.id);
  })
};

