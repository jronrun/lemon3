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

  function paramHandleCU(item) {
    item.type = 2;
    item.env = item.env || [];
    item.group = item.group || [];

    item.server.scope = parseInt(item.server.scope);
    var serverDefine = [];
    _.each((item.server.define || '').split(','), function (v) {
      if (v && v.length > 0) {
        serverDefine.push(v);
      }
    });
    item.server.define = serverDefine;

    item.interface.scope = parseInt(item.interface.scope);
    var interfaceDefine = [];
    _.each((item.interface.define || '').split(','), function (v) {
      if (v && v.length > 0) {
        interfaceDefine.push(v);
      }
    });
    item.interface.define = interfaceDefine;
  }

  function scopeDesc(field, scopeVal) {
    var text = generic.getSchema(field + '.properties.scope.const')[scopeVal];
    switch (scopeVal) {
      case 1:
      case 3:
        return generic.em('circle-o', text);
      case 2:
      case 4:
        return generic.em('circle-o-notch', text);
      default:
        return '';
    }
  }

  var serverLabel = [
    'Define',
    generic.listChooseBtn('check-circle-o', 'Choose', root.server, 1, 'server.define'),
    generic.listChooseBtn('eye', 'View', root.server, 2, 'server.define')
  ].join(' ');
  var serverEls = generic.schemaEl('server.scope',
    generic.getSchema('server.properties.scope'), {
      label: 'Scope'
    });
  serverEls.push(
    generic.textareaEl('server.define', {
      label: serverLabel,
      desc: 'Server ID, Multiple separated by commas'
    })
  );

  var interfaceLabel = [
    'Define',
    generic.listChooseBtn('check-circle-o', 'Choose', root.interface, 1, 'interface.define'),
    generic.listChooseBtn('eye', 'View', root.interface, 2, 'interface.define')
  ].join(' ');
  var interfaceEls = generic.schemaEl('interface.scope',
    generic.getSchema('interface.properties.scope'), {
      label: 'Scope'
    });
  interfaceEls.push(
    generic.textareaEl('interface.define', {
      label: interfaceLabel,
      desc: 'Interface ID, Multiple separated by commas'
    })
  );

  /**
   * API Power list
   */
  router.get(index.do, function (req, res, next) {
    async.waterfall([
      function (callback) {
        Environment.find({}).sort({_id: -1}).toArray(function (err, items) {
          var envData = {};
          _.each(items, function (item) {
            envData[item.id] = item;
          });

          callback(null, envData);
        });
      },
      function(envData, callback) {
        Group.find({}).sort({_id: -1}).toArray(function (err, items) {
          var groupData = {};
          _.each(items, function (item) {
            groupData[item.id] = item;
          });

          callback(null, {
            env: envData,
            group: groupData
          });
        });
      }
    ], function(err, result) {
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
          title: 'Environment',
          clazz: 'item-col-author',
          prop: function(item) {
            var env = [];
            _.each(item.env, function (envId) {
              var aEnv = result.env[envId];
              if (aEnv) {
                env.push(generic.info(getAction(root.env.retrieve, aEnv._id), aEnv.name));
              }
            });
            return env.join('</br>');
          }
        },
        {
          title: 'Group',
          clazz: 'item-col-author',
          prop: function(item) {
            var group = [];
            _.each(item.group, function (groupId) {
              var aGroup = result.group[groupId];
              if (aGroup) {
                group.push(generic.info(getAction(root.group.retrieve, aGroup._id), aGroup.name));
              }
            });
            return group.join('</br>');
          }
        },
        {
          title: 'Server',
          clazz: 'item-col-author',
          prop: function(item) {
            return scopeDesc('server', item.server.scope);
          }
        },
        {
          title: 'Interface',
          clazz: 'item-col-author',
          prop: function(item) {
              return scopeDesc('interface', item.interface.scope);
          }
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
      paramHandle: paramHandleCU
    }, req, res, next);
  });

  /**
   * API Power update
   */
  router.put(index.retrieve.do, function (req, res, next) {
    userReourceCacheReset();
    generic.update({
      checkExistsField: 'name',
      paramHandle: paramHandleCU
    }, req, res, next);
  });

  /**
   * API Power retrieve
   */
  router.get(index.retrieve.do, function (req, res, next) {
    async.waterfall([
      function (callback) {
        Power.findById(req.params.id, function (err, result) {
            if (err) {
              return res.json(answer.fail(err.message));
            }

            if (!result) {
              return res.json(answer.fail('item not exists.'));
            }

            callback(null, result);
        });
      },
      function (apiPower, callback) {
        Environment.find({owner: 1}).sort({_id: -1}).toArray(function (err, items) {
          var envData = [];
          _.each(items, function (item) {
            envData.push({
              tip: item.name,
              val: item.id,
              selected: (apiPower.env || []).indexOf(String(item.id)) != -1 ? 1 : 0,
              desc: generic.info(getAction(root.env.retrieve, item._id))
            });
          });

          callback(null, apiPower, envData);
        });
      },
      function(apiPower, envData, callback) {
        Group.find({owner: 1}).sort({_id: -1}).toArray(function (err, items) {
          var groupData = [];
          _.each(items, function (item) {
            groupData.push({
              tip: item.name,
              val: item.id,
              selected: (apiPower.group || []).indexOf(String(item.id)) != -1 ? 1 : 0,
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

      generic.retrieve({
        schemaExclude: ['resources', 'type', 'env', 'group', 'server', 'interface'],
        modelName: 'api-power',
        resultHandle: function(result,  respdata) {
          respdata.server = {
            scope: result.server.scope,
            define: _.join(result.server.define || [], ',')
          };

          respdata.interface = {
            scope: result.interface.scope,
            define: _.join(result.interface.define || [], ',')
          }
        },
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
   * API Power delete
   */
  router.delete(index.retrieve.do, function (req, res, next) {
    generic.delete({}, req, res, next);
  });

};

