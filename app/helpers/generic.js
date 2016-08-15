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

    getPickerDate: items.getPickerDate,
    setPickerDate: items.setPickerDate,

    envOwnerQuery: items.envOwnerQuery,
    groupOwnerQuery: items.groupOwnerQuery,

    serverOwnerQuery: items.serverOwnerQuery,
    interfaceOwnerQuery: items.interfaceOwnerQuery,

    selfOwnerQuery: items.selfOwnerQuery,

    title: function(title, href, itemId) {
      var theId = '';
      if (itemId) {
        theId = generic.em('sort-numeric-desc text-muted', itemId) + '&nbsp;&nbsp;&nbsp;&nbsp;';
      }
      return format(
        '<a href="%s" data-pjax><h4 class="item-title">%s<em class="fa fa-edit text-muted"></em>&nbsp;%s</h4></a>',
        href, theId, title
      );
    },

    ownerPublic: function(text) {
      return '<span class="text-success"><em class="fa fa-users"></em> ' + (text || 'Public') + '</span>';
    },

    ownerPrivate: function(text) {
      return '<span class="text-warning"><em class="fa fa-shield"></em> ' + (text || 'Private') + '</span>';
    },

    info: function(href, text, dataset) {
      return format('<a href="%s" data-%s><em class="fa fa-info-circle"></em> %s</a>', href, dataset || 'pjax', text || '');
    },

    label: function(text, clazz) {
      //style="font-size:60%;"
      return format('<span class="label %s"><small>%s</small></span>', clazz || 'label-default pull-right', text);
    },

    em: function(icon, text) {
      return '<em class="fa fa-' + icon + '"></em> ' + (text || '');
    },

    previewHref: function(href, text, title) {
      var html = [
        format('<a class="btn btn-secondary text-info icondh" data-preview title="%s" href="%s" ' +
          'style="border: 0px;" type="button">', title || '', href || ''),
        text || '',
        '</a>'
      ];

      return html.join('');
    },

    listChooseBtn: function(options) {
      options = _.extend({
        buttonEm: '',
        buttonText: '',
        source: {},
        field: '',
        chooseAction: null,  //1 list choose add, 2 list choose view
        listCardTitle: ''
      }, options);

      var act = actionWrap(options.source.action, 1);
      return generic.primaryBtn(options.buttonEm, options.buttonText, {
        'data-to': act.action,
        'data-base': act.base,
        'data-do': options.chooseAction,
        'data-field': options.field,
        'data-title': options.listCardTitle,
        listchoose: 1
      });
    },

    primaryBtn: function(em, text, attrs) {
      var props = [];
      _.each(attrs || {}, function (v, k) {
        props.push(k + '="' + v + '"');
      });
      return format('<button type="button" style="border: 0px;" ' +
        'class="btn btn-primary-outline btn-sm icondh" %s><em class="fa fa-%s"></em> %s</button>', props.join(' '), em, text);
    },

    searchInput: function(name, placeholder, isHide) {
      return {
        type: 1,
        tip: placeholder,
        name: name,
        isHide: isHide || 0     //1 hide
      };
    },

    /**
     *
     * @param name
     * @param defaultSelect   default select text
     * @param selectOptions   [{val: '', text: ''}]
     * @returns {{type: number, tip: *, name: *, options: *}}
       */
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
    datetimeEl: forms.datetimeEl,
    checkboxEl: forms.checkboxEl,
    radioEl: forms.radioEl,
    selectEl: forms.selectEl,
    inputEl: forms.inputEl,
    codemirrorEl: forms.codemirrorEl,
    formEl: forms.formEl,
    schemaEl: forms.schemaEl,
    newElOption: forms.newElOption,

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
     *  ],
     *  searchPreciseField: [],   //not fuzzy query
     *
     *  listName: '',                     //list name
     *  queryHandle: function(realQuery, query) {},  //query param pre handle
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
        searchPreciseField: [],
        pageCallback: false,
        pageSize: DEFAULT_PAGESIZE,
        pageOptions: {},
        ownerQuery: 0,
        queryHandle: false,
        listName: index.desc,
        itemAction: 1,

        //inner use
        listchoose: {
          has: 0,
          ids: '',
          body: ''
        }
      }, options || {});

      var queryStr = req.header('query') || req.param('urlqry') || '', query = {}, realQuery = {};
      if (queryStr.length > 0) {
        query = crypto.decompress(queryStr);
        try {
          query = convertData(json5s.parse(query));
        } catch (e) {
          throw Error('invalid query parameters: ' + e.message);
        }

        _.each(query, function (v, k) {
          if (v.length > 0) {
            if ('id' != k) {
              if (options.searchPreciseField.indexOf(k) != -1) {
                realQuery[k] = v;
              } else {
                realQuery[k] = new RegExp(v, 'i');
              }
            }
          }
        });
      }

      var listchooseStr = req.header('listchoose') || '';
      if (listchooseStr.length > 0) {
        var listchoose = crypto.decompress(listchooseStr);
        try {
          listchoose = convertData(json5s.parse(listchoose));
        } catch (e) {
          throw Error('invalid listchoose parameters: ' + e.message);
        }

        listchoose.from = req.reference;
        var origin = listchoose.params || {};
        try {
          origin = crypto.decompress(origin.item);
          origin = convertData(json5s.parse(origin));
        } catch (e) {
          return res.json(answer.fail('invalid listchoose item: ' + e.message));
        }

        var fieldIds = _.get(origin, listchoose.field);
        //do 1 list choose add, 2 list choose view
        //1 list choose add
        if (1 == listchoose.do) {

        }
        //2 list choose view
        else if (2 == listchoose.do) {
          if (fieldIds) {
            _.extend(query, {id: fieldIds});
            if (queryStr.length > 0) {
              queryStr = crypto.compress(query);
            } else {
              queryStr = crypto.compress({id: fieldIds});
            }
          }
        }

        var listchooseIds = [];
        _.each(fieldIds.split(','), function (v) {
          if (v && v.length > 0) {
            listchooseIds.push(parseInt(v));
          }
        });

        options.listchoose = {
          has: 1,
          ids: crypto.compress(listchooseIds),
          body: crypto.compress(listchoose)
        };

      }

      if (_.has(query, 'id') && query.id.length > 0) {
        var ids = [];
        _.each(query.id.split(','), function (v) {
          if (v && v.length > 0) {
            ids.push(parseInt(v));
          }
        });

        _.extend(realQuery, {id: {$in: ids}});
      }

      if (_.isFunction(options.queryHandle)) {
        if (BREAK == options.queryHandle(realQuery, query)) {
          return;
        }
      }

      if (1 == options.ownerQuery) {
        var ownerQuery = {};
        if ('env' == model.modelName) {
          ownerQuery = generic.envOwnerQuery(req);
        } else if ('group' == model.modelName) {
          ownerQuery = generic.groupOwnerQuery(req);
        } else if ('server' == model.modelName) {
          ownerQuery = generic.serverOwnerQuery(req);
        } else if ('interf' == model.modelName) {
          ownerQuery = generic.interfaceOwnerQuery(req);
        } else {
          ownerQuery = generic.selfOwnerQuery(req);
        }

        realQuery = _.extend(realQuery, ownerQuery);
      }

      var slen = Math.ceil((options.search.length - 1) / 3) + 1;
      var searchLenCeil = [];
      if (slen >= 2 && options.search.length > 3) {
        for (var i = 0; i < slen; i++) {
          searchLenCeil.push(1);
        }
      }

      model.page(realQuery, req.params.page, options.pageCallback, options.pageSize, options.pageOptions).then(function (result) {
        res.render(index.page, {
          pagename: 'items-list-page',
          pageedit: index.editor ? index.editor.action : '',
          list: items.asShowData(options.defines, result.items),
          page: result.page,
          action: actionWrap(index.action).base,
          retrieveAction: index.retrieve ? actionWrap(index.retrieve.action).base : '',
          desc: options.listName,
          search: options.search,
          searchLastEl: options.search.length - 1,
          searchLenCeil: searchLenCeil,
          queryStr: queryStr,
          itemAction: options.itemAction,
          listchoose: options.listchoose
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
     *  resultHandle: function(result, respdata) {},  //form element pre handle
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
        resultHandle: false,
        defineForm: {},
        defineElement: {},
        tabs: [],

        //inner
        listchooseback: {
          has: 0,
          body: ''
        }
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

      var listchoosebackStr = req.header('listchooseback') || '';
      if (listchoosebackStr.length > 0) {
        //var lcback = crypto.decompress(listchoosebackStr);
        //try {
        //  lcback = convertData(json5s.parse(lcback));
        //} catch (e) {
        //  throw Error('invalid listchooseback parameters: ' + e.message);
        //}

        options.listchooseback = {
          has: 1,
          body: listchoosebackStr
        }
      }

      _.each(options.tabs, function (aTab) {
        aTab.tabId = aTab.tabName;
        aTab.tabId = aTab.tabId.replace(/\s/g,'-');
      });

      var schema = model.desc(options.schemaExclude);
      var value = model.getEditVal(schema, true, {}, true, options.resultHandle);

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
        form_type: options.masterFormType,
        listchooseback: options.listchooseback
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
        tabs: [],

        //inner
        listchooseback: {
          has: 0,
          body: ''
        }
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

        var listchoosebackStr = req.header('listchooseback') || '';
        if (listchoosebackStr.length > 0) {
          options.listchooseback = {
            has: 1,
            body: listchoosebackStr
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
          addition: crypto.compress(addition),
          listchooseback: options.listchooseback
        });
      });
    },

    /**
     * create
     * options: {
     *  resourceTab: 0,       //has resource tab, 1 has, 2 show readonly
     *  sequenceId: 0,        //need auto increment sequence id, 1 yes
     *  checkExistsField: '', //check field value exists if not empty, string or array
     *  checkExistsField2: '', //check field value exists if not empty, string or array
     *  paramHandle: function(item){},     //param pre handle
     *  beforeCreateHandle: function(item, callback){}   //before create handle (waterfall)
     * }
     */
    create: function(options, req, res, next) {
      options = _.extend({
        resourceTab: 0,
        sequenceId: 0,
        checkExistsField: '',
        checkExistsField2: '',
        paramHandle: false,
        beforeCreateHandle: false
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
          var fields = [];
          if (_.isString(field) && field.length > 0) {
            fields.push(field);
          } else if (_.isArray(field)) {
            fields = field;
          }

          if (fields.length > 0) {
            var qry = {};

            _.each(fields, function (prop) {
              qry[prop] = _.get(target, prop);
            });

            model.find(qry).limit(1).next(function(err, exists){
              if (exists) {
                var aExist = {};
                _.each(fields, function (prop) {
                  aExist[prop] = _.get(exists, prop);
                });

                return res.json(answer.fail('The ' + JSON.stringify(aExist) + ' already exist.'));
              }

              callback(null, target);
            });
          } else {
            callback(null, target);
          }
        },
        function(target, callback) {
          var field = options.checkExistsField2;
          var fields = [];
          if (_.isString(field) && field.length > 0) {
            fields.push(field);
          } else if (_.isArray(field)) {
            fields = field;
          }

          if (fields.length > 0) {
            var qry = {};

            _.each(fields, function (prop) {
              qry[prop] = _.get(target, prop);
            });

            model.find(qry).limit(1).next(function(err, exists){
              if (exists) {
                var aExist = {};
                _.each(fields, function (prop) {
                  aExist[prop] = _.get(exists, prop);
                });

                return res.json(answer.fail('The ' + JSON.stringify(aExist) + ' already exist.'));
              }

              callback(null, target);
            });
          } else {
            callback(null, target);
          }
        },
        function(target, callback) {
          if (_.isFunction(options.beforeCreateHandle)) {
            options.beforeCreateHandle(target, callback);
          } else {
            callback(null, target);
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
     *  checkExistsField: '', //check field value exists if not empty, string or array
     *  checkExistsField2: '', //check field value exists if not empty, string or array
     *  resourceUpdate: 0,    //update resource tab, 1 yes
     *  paramHandle: function(item, options){}     //param pre handle
     *  beforeUpdateHandle: function(target, itemObj, callback) {} //before update handle  (waterfall)
     *  afterUpdateHandle: function(target, itemObj, callback) {}   //after update handle  (waterfall)
     * }
     */
    update: function(options, req, res, next) {
      options = _.extend({
        resourceTab: 0,
        resourceUpdate: 0,
        checkExistsField: '',
        checkExistsField2: '',
        paramHandle: false,
        beforeUpdateHandle: false,
        afterUpdateHandle: false
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
        if (BREAK == options.paramHandle(item, options)) {
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

            callback(null, item, result);
          });
        },
        function(target, itemObj, callback) {
          var field = options.checkExistsField;
          var fields = [];
          if (_.isString(field) && field.length > 0) {
            fields.push(field);
          } else if (_.isArray(field)) {
            fields = field;
          }

          if (fields.length > 0) {
            var qry = {
              '_id': { $ne: model.toObjectID(itemId) }
            };

            _.each(fields, function (prop) {
              qry[prop] = _.get(target, prop);
            });

            model.find(qry).limit(1).next(function(err, exists){
              if (exists) {
                var aExist = {};
                _.each(fields, function (prop) {
                  aExist[prop] = _.get(exists, prop);
                });

                return res.json(answer.fail('The ' + JSON.stringify(aExist) + ' already exist.'));
              }

              callback(null, target, itemObj);
            });
          } else {
            callback(null, target, itemObj);
          }
        },
        function(target, itemObj, callback) {
          var field = options.checkExistsField2;
          var fields = [];
          if (_.isString(field) && field.length > 0) {
            fields.push(field);
          } else if (_.isArray(field)) {
            fields = field;
          }

          if (fields.length > 0) {
            var qry = {
              '_id': { $ne: model.toObjectID(itemId) }
            };

            _.each(fields, function (prop) {
              qry[prop] = _.get(target, prop);
            });

            model.find(qry).limit(1).next(function(err, exists){
              if (exists) {
                var aExist = {};
                _.each(fields, function (prop) {
                  aExist[prop] = _.get(exists, prop);
                });

                return res.json(answer.fail('The ' + JSON.stringify(aExist) + ' already exist.'));
              }

              callback(null, target, itemObj);
            });
          } else {
            callback(null, target, itemObj);
          }
        },
        function(target, itemObj, callback) {
          if (_.isFunction(options.beforeUpdateHandle)) {
            options.beforeUpdateHandle(target, itemObj, callback);
          } else {
            callback(null, target, itemObj);
          }
        },
        function (target, itemObj, callback) {
          model.updateById(itemId, {$set: target}, function (err) {
            if (err) {
              return res.json(answer.fail(err.message));
            }

            callback(null, target, itemObj);
          });
        },

        function (target, itemObj, callback) {
          if (_.isFunction(options.afterUpdateHandle)) {
            options.afterUpdateHandle(target, itemObj, callback);
          } else {
            callback(null, target);
          }
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
