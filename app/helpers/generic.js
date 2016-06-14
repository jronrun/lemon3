'use strict';

var log = log_from('generic'),
  items = require('./items'),
  forms = require('./forms');

var BREAK = -1;

module.exports = function(model, index, defineForm) {

  defineForm = _.extend({
    form: {},     //@see forms.schemaForm.formOptions
    element: {}   //@see forms.schemaForm.options
  }, defineForm || {});

  var generic = {
    BREAK: BREAK,
    ownerQuery: function(req) {
      var aUser = req.user || {};
      if (aUser.isAdmin) {
        return {};
      }

      return {
        $or:[
          { owner: 1},
          {
            "create_by.id": aUser.id,
            owner: 2
          }
        ]
      };
    },

    title: function(title, href) {
      return format(
        '<a href="%s" data-pjax><h4 class="item-title"><em class="fa fa-edit"></em>&nbsp;%s</h4></a>',
        href, title
      );
    },

    ownerPublic: function(text) {
      return '<span class="text-success"><em class="fa fa-users"></em> ' + (text || 'Public') + '</span>';
    },

    ownerPrivate: function(text) {
      return '<span class="text-warning"><em class="fa fa-shield"></em> ' + (text || 'Private') + '</span>';
    },

    info: function(href, text) {
      return format('<a href="%s" data-pjax><em class="fa fa-info-circle"></em> %s</a>', href, text || '');
    },

    em: function(icon, text) {
      return '<em class="fa fa-' + icon + '"></em> ' + (text || '');
    },

    searchInput: function(name, placeholder) {
      return {
        type: 1,
        tip: placeholder,
        name: name
      };
    },

    searchSelect: function(name, defaultSelect, selectOptions) {
      return {
        type: 2,
        tip: defaultSelect,
        name: name,
        options: selectOptions
      };
    },

    jsonForm: forms.fromJSON,
    schemaForm: forms.fromSchema,
    element: forms.element,
    buttonEl: forms.buttonEl,
    textareaEl: forms.textareaEl,
    checkboxEl: forms.checkboxEl,
    radioEl: forms.radioEl,
    selectEl: forms.selectEl,
    inputEl: forms.inputEl,
    codemirrorEl: forms.codemirrorEl,
    formEl: forms.formEl,
    schemaEl: forms.schemaEl,

    getSchema: function(field) {
      if (field) {
        return _.get(model.define.schema.properties, field);
      }

      return model.define.schema;
    },

    /**
     * list
     * options: {
     *  defines: [{
     *    "title": "",
     *    "clazz": "",
     *    "prop": "",
     *    "type": ""
     *  }],
     *  search: [
     *    {
     *      type: 1,    //element type, 1 input, 2 select
     *      tip: '',    //element tip, placeholder if input, default option if select
     *      name: '',   //element name
     *      options: [  //select options
     *        {
     *          val: '',  //option value
     *          text: '', //option text
     *        }
     *      ]
     *    }
     *  ]
     *  listName: '',                     //list name
     *  queryHandle: function(query) {},  //query param pre handle
     *  ownerQuery: 0,                    //is owner query, 1 yes
     *
     *  pageCallback: false,          //model.page parameter callback
     *  pageSize: DEFAULT_PAGESIZE,   //model.page parameter size
     *  pageOptions: {},              //model.page parameter options,
     * }
     */
    list: function(options, req, res, next) {
      options = _.extend({
        defines: [],
        search: [],
        pageCallback: false,
        pageSize: DEFAULT_PAGESIZE,
        pageOptions: {},
        ownerQuery: 0,
        queryHandle: false,
        listName: index.desc
      }, options || {});

      var queryStr = req.header('query') || '', query = {}, realQuery = {};
      if (queryStr.length > 0) {
        var query = crypto.decompress(queryStr);
        try {
          query = convertData(json5s.parse(query));
        } catch (e) {
          throw Error('invalid query parameters: ' + e.message);
        }

        _.each(query, function (v, k) {
          if (v.length > 0) {
            realQuery[k] = new RegExp(v, 'i');
          }
        });
      }

      if (_.isFunction(options.queryHandle)) {
        if (BREAK == options.queryHandle(realQuery)) {
          return;
        }
      }

      if (1 == options.ownerQuery) {
        realQuery = _.extend(realQuery, generic.ownerQuery(req));
      }

      model.page(realQuery, req.params.page, options.pageCallback, options.pageSize, options.pageOptions).then(function (result) {
        res.render(index.page, {
          pagename: 'items-list-page',
          pageedit: index.editor ? index.editor.action : '',
          list: items.asShowData(options.defines, result.items),
          page: result.page,
          action: actionWrap(index.action).base,
          retrieveAction: actionWrap(index.retrieve.action).base,
          desc: options.listName,
          search: options.search,
          searchLastEl: options.search.length - 1,
          queryStr: queryStr
        });
      });
    },

    /**
     * editor
     * options : {
     *  schemaExclude: [],    //exclude schema field
     *  resourceTab: 0,       //show resource tab, 1 show, 2 show readonly
     *  resourceAction: '',   //resource load action
     *  modelName: '',        //model name
     *  hasButtons: 1,        //edit button 0 hide, 1 show
     *  listHomePageArg: 1,   //list home pagination arg
     *  masterFormType: 1,    //master form show type, 1 html form, 2 codemirror
     *  formElHandle: function(query) {},  //form element pre handle
     *  defineForm: {},       //@see forms.schemaForm.formOptions
     *  defineElement: {},    //@see forms.schemaForm.options
     *  tabs: [
     *    {
     *      tabName: '',                  //tab name
     *      form: [{forms.formElement}]   //form data
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
        hasButtons: 1,
        listHomePageArg: 1,
        masterFormType: 1,
        formElHandle: false,
        defineForm: {},
        defineElement: {},
        tabs: []
      }, options || {});

      var formEls = {};
      if (1 == options.masterFormType) {
        formEls = forms.fromSchema(model.define.schema,
          _.extend({}, defineForm.element, options.defineElement),
          _.extend({}, defineForm.form, options.defineForm), options.schemaExclude);

        if (_.isFunction(options.formElHandle)) {
          if (BREAK == options.formElHandle(forms.helper(formEls))) {
            return;
          }
        }
      }

      _.each(options.tabs, function (aTab) {
        aTab.tabId = aTab.tabName;
        aTab.tabId = aTab.tabId.replace(/\s/g,'-');
      });

      var schema = model.desc(options.schemaExclude);
      var value = model.getEditVal(schema, true);
      res.render(index.editor.page, {
        pagename: 'item-editor-page',
        schema: crypto.compress(schema),
        value: value,
        res_tab: options.resourceTab,
        res_action: options.resourceAction,
        desc: options.modelName,
        hasButtons: options.hasButtons,
        method: HttpMethod.POST,
        action: index.editor.action,
        listAction: actionWrap(index.action, options.listHomePageArg).action,
        tabs: options.tabs,
        form: formEls,
        form_type: options.masterFormType
      });
    },

    /**
     * retrieve
     * options : {
     *  schemaExclude: [],    //exclude schema field
     *  resourceTab: 0,       //show resource tab, 1 show, 2 show readonly
     *  resourceAction: '',   //resource load action
     *  modelName: '',        //model name
     *  hasButtons: 1,        //edit button 0 hide, 1 show
     *  listHomePageArg: 1,   //list home pagination arg
     *  masterFormType: 1,    //master form show type, 1 html form, 2 codemirror
     *  formElHandle: function(query) {},  //form element pre handle
     *  resultHandle: function(result,respdata) {},  //form element pre handle
     *  additionHandle: function(result, addition) {},      //addition data response pre handle
     *  defineForm: {},       //@see forms.schemaForm.formOptions
     *  defineElement: {},    //@see forms.schemaForm.options
     *  tabs: [
     *    {
     *      tabName: '',                  //tab name
     *      form: [{forms.formElement}]   //form data
     *    }
     *  ],
     * }
     */
    retrieve: function(options, req, res, next) {
      options = _.extend({
        schemaExclude: [],
        resourceTab: 0,
        resourceAction: '',
        modelName: model.modelName,
        hasButtons: 1,
        listHomePageArg: 1,
        masterFormType: 1,
        formElHandle: false,
        resultHandle: false,
        additionHandle: false,
        defineForm: {},
        defineElement: {},
        tabs: []
      }, options || {});

      var itemId = req.params.id;
      model.findById(itemId, function (err, result) {
        if (err) {
          return res.json(answer.fail(err.message));
        }

        if (!result) {
          return res.json(answer.fail('item not exists.'));
        }

        var formEls = {}, addition = {};
        if (1 == options.masterFormType) {
          formEls = forms.fromSchema(model.define.schema,
            _.extend({}, defineForm.element, options.defineElement),
            _.extend({}, defineForm.form, options.defineForm), options.schemaExclude);

          if (_.isFunction(options.formElHandle)) {
            if (BREAK == options.formElHandle(forms.helper(formEls, result))) {
              return;
            }
          }
        }

        var schema = model.desc(options.schemaExclude);
        var value = model.getEditVal(schema, true, result, true, options.resultHandle);

        if (_.isFunction(options.additionHandle)) {
          if (BREAK == options.additionHandle(result, addition)) {
            return;
          }
        }

        _.each(options.tabs, function (aTab) {
          aTab.tabId = aTab.tabName;
          aTab.tabId = aTab.tabId.replace(/\s/g,'-');
        });

        res.render(index.retrieve.page, {
          pagename: 'item-editor-page',
          schema: crypto.compress(schema),
          value: value,
          res_tab: options.resourceTab,
          res_action: options.resourceAction,
          desc: options.modelName,
          hasButtons: options.hasButtons,
          method: HttpMethod.PUT,
          action: actionWrap(index.retrieve.action, itemId).action,
          listAction: actionWrap(index.action, options.listHomePageArg).action,
          tabs: options.tabs,
          update: 1,
          form: formEls,
          form_type: options.masterFormType,
          addition: crypto.compress(addition)
        });
      });
    },

    /**
     * create
     * options: {
     *  resourceTab: 0,       //has resource tab, 1 has, 2 show readonly
     *  sequenceId: 0,        //need auto increment sequence id, 1 yes
     *  checkExistsField: '', //check field value exists if not empty
     *  checkExistsField2: '', //check field value exists if not empty
     *  paramHandle: function(item){}     //param pre handle
     * }
     */
    create: function(options, req, res, next) {
      options = _.extend({
        resourceTab: 0,
        sequenceId: 0,
        checkExistsField: '',
        checkExistsField2: '',
        paramHandle: false
      }, options || {});

      var item = crypto.decompress(req.body.item);
      try {
        item = convertData(json5s.parse(item));
      } catch (e) {
        return res.json(answer.fail('invalid item: ' + e.message));
      }

      if (1 == options.resourceTab) {
        item.resources = req.body.resource || [];
      } else {
        delete item.resources;
        delete item.resource;
      }

      item.create_time = new Date();
      item.last_modify_time = new Date();

      if (_.isFunction(options.paramHandle)) {
        if (BREAK == options.paramHandle(item)) {
          return;
        }
      }

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
          var field = options.checkExistsField2;
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
        return res.json(answer.succ({
          res_tab: options.resourceTab
        }, 'Create success.'));
      });
    },

    /**
     * update
     * options: {
     *  resourceTab: 0,       //has resource tab, 1 has, 2 show readonly
     *  checkExistsField: '', //check field value exists if not empty
     *  checkExistsField2: '', //check field value exists if not empty
     *  resourceUpdate: 0,    //update resource tab, 1 yes
     *  paramHandle: function(item){}     //param pre handle
     * }
     */
    update: function(options, req, res, next) {
      options = _.extend({
        resourceTab: 0,
        resourceUpdate: 0,
        checkExistsField: '',
        checkExistsField2: '',
        paramHandle: false
      }, options || {});

      var itemId = req.params.id;
      var item = crypto.decompress(req.body.item);
      try {
        item = convertData(json5s.parse(item));
      } catch (e) {
        return res.json(answer.fail('invalid item: ' + e.message));
      }

      if (1 == options.resourceTab) {
        item.resources = req.body.resource || [];
      } else {
        delete item.resources;
        delete item.resource;
      }
      item.last_modify_time = new Date();

      if (_.isFunction(options.paramHandle)) {
        if (BREAK == options.paramHandle(item)) {
          return;
        }
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
        function(target, callback) {
          var field = options.checkExistsField2;
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
        return res.json(answer.succ({
          resourceUpdate: options.resourceUpdate,
          res_tab: options.resourceTab
        }, 'Update success.'));
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
        descField: 'name'
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
