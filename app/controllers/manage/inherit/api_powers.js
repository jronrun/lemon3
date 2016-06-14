'use strict';

var Power = app_require('models/power'),
  Environment = app_require('models/api/env'),
  Group = app_require('models/api/group'),
  Server = app_require('models/api/server'),
  Interface = app_require('models/api/interf'),
  log = log_from('api-powers');

module.exports = function (router, index, root) {

  var generic = app_require('helpers/generic')(Power, index, {
    element: {
      desc: {
        label: 'Description'
      }
    }
  });

  /**
   * API Power list
   */
  router.get(index.do, function (req, res, next) {
    var defines = [
      {
        title: 'Name',
        prop: function(item) {
          return generic.title(item.name, getAction(root['api-power'].retrieve, item._id));
        },
        clazz: 'fixed pull-left item-col-title'
      },
      {
        title: 'Description',
        prop: 'desc',
        clazz: 'item-col-author'
      },
      {
        title: 'Create',
        prop: 'create_time',
        clazz: 'item-col-date',
        type: 'date'
      }
    ];

    var search = [
      generic.searchInput('name', 'search API power...')
    ];

    generic.list({
      defines: defines,
      search: search,
      queryHandle: function(query) {
        _.extend(query, {
          type: 2
        })
      }
    }, req, res, next);

  });

  /**
   * API Power editor
   */
  router.get(index.editor.do, function (req, res, next) {
    async.waterfall([
      function (callback) {
        Environment.find({owner: 1}).sort({_id: -1}).toArray(function (err, items) {
          var envData = [];
          _.each(items, function (item) {
            envData.push({
              tip: item.name,
              val: item.id,
              selected: 0,
              desc: generic.info(getAction(root.env.retrieve, item._id))
            });
          });

          callback(null, envData);
        });
      },
      function(envData, callback) {
        Group.find({owner: 1}).sort({_id: -1}).toArray(function (err, items) {
          var groupData = [];
          _.each(items, function (item) {
            groupData.push({
              tip: item.name,
              val: item.id,
              selected: 0,
              desc: generic.info(getAction(root.group.retrieve, item._id))
            });
          });

          callback(null, {
            env: envData,
            group: groupData
          });
        });
      }
    ], function(err, result) {

      var envEls = [
        generic.checkboxEl('env', {
          label: '',
          options: result.env
        })
      ];

      var groupEls = [
        generic.checkboxEl('group', {
          label: '',
          options: result.group
        })
      ];

      var serverEls = generic.schemaEl('server.scope',
        generic.getSchema('server.properties.scope'), {
          label: 'Scope'
        });
      serverEls.push(
        generic.textareaEl('server.define', {
          label: 'Define',
          desc: 'Server ID, Multiple separated by commas'
        })
      );

      var interfaceEls = generic.schemaEl('interface.scope',
        generic.getSchema('interface.properties.scope'), {
          label: 'Scope'
        });
      interfaceEls.push(
        generic.textareaEl('interface.define', {
          label: 'Define',
          desc: 'Interface ID, Multiple separated by commas'
        })
      );

      generic.editor({
        schemaExclude: ['resources', 'type', 'env', 'group', 'server', 'interface'],
        modelName: 'api-power',
        tabs: [
          {
            tabName: 'Environment',
            form: generic.formEl(envEls)
          },
          {
            tabName: 'Group',
            form: generic.formEl(groupEls)
          },
          {
            tabName: 'Server',
            form: generic.formEl(serverEls)
          },
          {
            tabName: 'Interface',
            form: generic.formEl(interfaceEls)
          }
        ]
      }, req, res, next);

    });
  });

  /**
   * API Power create
   */
  router.post(index.editor.do, function (req, res, next) {
    generic.create({
      sequenceId: 1,
      checkExistsField: 'name',
      paramHandle: function(item) {
        item.type = 2;
      }
    }, req, res, next);
  });

  /**
   * API Power update
   */
  router.put(index.retrieve.do, function (req, res, next) {
    userReourceCacheReset();
    generic.update({
      checkExistsField: 'name',
      paramHandle: function(item) {
        item.type = 2;
      }
    }, req, res, next);
  });

  /**
   * API Power retrieve
   */
  router.get(index.retrieve.do, function (req, res, next) {
    generic.retrieve({
      schemaExclude: ['resources', 'type', 'env', 'group', 'server', 'interface'],
      modelName: 'api-power'
    }, req, res, next);
  });

  /**
   * API Power delete
   */
  router.delete(index.retrieve.do, function (req, res, next) {
    generic.delete({}, req, res, next);
  });

};

