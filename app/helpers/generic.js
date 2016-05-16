'use strict';

var log = log_from('generic'),
  items = require('./items');

module.exports = function(model, index) {

  var generic = {

    /**
     * list
     * options: {
     * defines: [{
     *    "title": "",
     *    "clazz": "",
     *    "prop": "",
     *    "type": ""
     *  }]
     * }
     */
    list: function(options, req, res, next) {
      options = _.extend({
        defines: []
      }, options || {});

      model.page({}, req.params.page).then(function (result) {
        res.render(index.page, {
          pagename: 'items-list-page',
          pageedit: index.editor.action,
          list: items.asShowData(options.defines, result.items),
          page: result.page,
          action: actionWrap(index.action).base,
          retrieveAction: actionWrap(index.retrieve.action).base
        });
      });
    },

    /**
     * editor
     * options : {
     *  schemaExclude: [],    //exclude schema field
     *  resourceTab: 0,       //show resource tab, 1 show
     *  resourceAction: '',   //resource load action
     *  modelName: '',        //model name
     *  listHomePageArg: 1,   //list home pagination arg
     *  selectTabs: [
     *    {
     *      tabName: '',
     *      inputName: '',    //checkbox name
     *      data: [{
     *        name: '',       //show text
     *        value: '',      //select value
     *        selected: 0     //0|1, 1 selected
     *        }]
     *    }
     *  ],
     * }
     */
    editor: function(options, req, res, next) {
      options = _.extend({
        schemaExclude: [],
        resourceTab: 0,
        resourceAction: '',
        modelName: model.modelName,
        listHomePageArg: 1,
        selectTabs: []
      }, options || {});

      var schema = model.desc(options.schemaExclude);
      var value = model.getEditVal(schema, true);
      res.render(index.editor.page, {
        pagename: 'item-editor-page',
        schema: crypto.compress(schema),
        value: value,
        res_tab: options.resourceTab,
        res_action: options.resourceAction,
        desc: options.modelName,
        method: HttpMethod.POST,
        action: index.editor.action,
        listAction: actionWrap(index.action, options.listHomePageArg).action,
        sel_tabs: options.selectTabs
      });
    },

    /**
     * create
     * options: {
     *  resourceTab: 0,       //has resource tab, 1 has
     *  sequenceId: 0,        //need auto increment sequence id, 1 yes
     *  checkExistsField: '', //check field value exists if not empty
     * }
     */
    create: function(options, req, res, next) {
      options = _.extend({
        resourceTab: 0,
        sequenceId: 0,
        checkExistsField: ''
      }, options || {});

      var item = crypto.decompress(req.body.item);
      try {
        item = JSON.parse(item);
      } catch (e) {
        return res.json(answer.fail('invalid item: ' + e.message));
      }

      if (options.resourceTab) {
        item.resources = req.body.resource || [];
      }
      item.create_time = new Date();

      async.waterfall([
        function(callback) {
          //need sequence id
          if (options.sequenceId) {
            model.nextId(function (id) {
              item.id = id;

              var check = model.validate(item);
              if (!check.valid) {
                return res.json(answer.fail(check.msg));
              }

              callback(null, item);
            });
          }
          //no need sequence id
          else {
            var check = model.validate(item);
            if (!check.valid) {
              return res.json(answer.fail(check.msg));
            }

            callback(null, item);
          }
        },
        function(target, callback) {
          var field = options.checkExistsField;
          if (field.length > 0) {
            var qry = {};
            //{name: target.name}
            qry[field] = target[field];
            model.find(qry).limit(1).next(function(err, exists){
              if (exists) {
                return res.json(answer.fail('The ' + field + ' ' + target[field] + ' already exist.'));
              }
              callback(null, item);
            });
          } else {
            callback(null, item);
          }
        },
        function(target, callback) {
          model.insertOne(target, function(err, result) {
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
    },

    /**
     * update
     * options: {
     *  resourceTab: 0,       //has resource tab, 1 has
     *  checkExistsField: '', //check field value exists if not empty
     * }
     */
    update: function(options, req, res, next) {
      options = _.extend({
        resourceTab: 0,
        checkExistsField: ''
      }, options || {});

      var itemId = req.params.id;
      var item = crypto.decompress(req.body.item);
      try {
        item = JSON.parse(item);
      } catch (e) {
        return res.json(answer.fail('invalid item: ' + e.message));
      }

      if (options.resourceTab) {
        item.resources = req.body.resource || [];
      }

      async.waterfall([
        function(callback) {
          model.findById(itemId, function (err, result) {
            if (err) {
              return res.json(answer.fail(err.message));
            }

            if (!result) {
              return res.json(answer.fail('item not exists.'));
            }

            var check = model.validate(_.extend(result, item));
            if (!check.valid) {
              return res.json(answer.fail(check.msg));
            }

            callback(null, item);
          });
        },
        function(target, callback) {
          var field = options.checkExistsField;
          if (field.length > 0) {
            var qry = {
              $ne: model.toObjectID(itemId)
            };

            //{name: target.name}
            qry[field] = target[field];
            model.find(qry).limit(1).next(function(err, exists){
              if (exists) {
                return res.json(answer.fail('The ' + field + ' ' + target[field] + ' already exist.'));
              }

              callback(null, target);
            });
          } else {
            callback(null, target);
          }
        },

        function (target, callback) {
          model.updateById(itemId, {$set: target}, function (err) {
            if (err) {
              return res.json(answer.fail(err.message));
            }

            callback(null, target);
          });
        }
      ], function (err, result) {
        return res.json(answer.succ({}, 'Update success.'));
      });
    },

    /**
     * retrieve
     * options : {
     *  schemaExclude: [],    //exclude schema field
     *  resourceTab: 0,       //show resource tab, 1 show
     *  resourceAction: '',   //resource load action
     *  modelName: '',        //model name
     *  listHomePageArg: 1,   //list home pagination arg
     * }
     */
    retrieve: function(options, req, res, next) {
      options = _.extend({
        schemaExclude: [],
        resourceTab: 0,
        resourceAction: '',
        modelName: model.modelName,
        listHomePageArg: 1
      }, options || {});

      var itemId = req.params.id;
      model.findById(itemId, function (err, result) {
        if (err) {
          return res.json(answer.fail(err.message));
        }

        if (!result) {
          return res.json(answer.fail('item not exists.'));
        }

        var schema = model.desc(options.schemaExclude);
        var value = model.getEditVal(schema, true, result);

        res.render(index.retrieve.page, {
          pagename: 'item-editor-page',
          schema: crypto.compress(schema),
          value: value,
          res_tab: options.resourceTab,
          res_action: options.resourceAction,
          desc: options.modelName,
          method: HttpMethod.PUT,
          action: actionWrap(index.retrieve.action, itemId).action,
          listAction: actionWrap(index.action, options.listHomePageArg).action
        });
      });
    },

    /**
     * delete
     * options: {
     *  descField: ''
     * }
     */
    delete: function(options, req, res, next) {
      options = _.extend({
        descField: ''
      }, options || {});

      model.findById(req.params.id, function (err, result) {
        if (err) {
          return res.json(answer.fail(err.message));
        }

        if (!result) {
          return res.json(answer.fail('item not exists.'));
        }

        model.removeById(req.params.id, function(err) {
          if (err) {
            return res.json(answer.fail(err.message));
          }

          var desc = options.descField ? result[options.descField] : '';
          return res.json(answer.succ(false, 'Remove ' + desc + ' success.'));
        });

      });
    }
  };

  return generic;
};
