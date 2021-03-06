'use strict';

var Server = app_require('models/api/server'),
  Environment = app_require('models/api/env'),
  Group = app_require('models/api/group'),
  log = log_from('servers');

module.exports = function (router, index, root) {

  var generic = app_require('helpers/generic')(Server, index, {
    element: {
      url: {
        label: 'Request URL'
      },
      home_url: {
        label: 'Login URL',
        desc: 'Home or Login URL'
      },
      request: {
        param_name: {
          label: 'Parameter Name'
        },
        interf_prop: {
          label: 'Interface Property'
        },
        data_type: {
          label: 'Data Type'
        }
      },
      desc: {
        label: 'Description'
      }
    }
  });

  var addParamsEl = generic.codemirrorEl('request_add_params', {
    label: '',
    desc: '[Optional] Add to request data each time'
  });

  /**
   * Server list
   */
  router.get(index.do, function (req, res, next) {
    async.waterfall([
      function (callback) {
        Environment.find(generic.envOwnerQuery(req)).sort({_id: -1}).toArray(function (err, items) {
          var envData = {}, envIds = [];
          _.each(items, function (item) {
            envData[item.id] = item;
            envIds.push(item.id);
          });

          callback(null, envData, envIds);
        });
      },
      function(envData, envIds, callback) {
        Group.find(generic.groupOwnerQuery(req)).sort({_id: -1}).toArray(function (err, items) {
          var groupData = {}, groupIds = [];
          _.each(items, function (item) {
            groupData[item.id] = item;
            groupIds.push(item.id);
          });

          callback(null, {
            env: envData,
            envIds: envIds,
            group: groupData,
            groupIds: groupIds
          });
        });
      }
    ], function(err, result) {
      var defines = [
        {
          title: 'Name',
          prop: function(item) {
            return generic.title(item.name, getAction(root.server.retrieve, item._id), item.id);
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
          prop: function(item) {
            var aEnv = result.env[item.env_id];
            if (!aEnv) {
              return generic.ownerPrivate();
            }
            return generic.info(getAction(root.env.retrieve, aEnv._id),
              format('<span class="text-%s">%s</span>', aEnv.alert_level, aEnv.name));
          },
          clazz: 'item-col-author'
        },
        {
          title: 'Group',
          prop: function(item) {
            var aGroup = result.group[item.group_id];
            if (!aGroup) {
              return generic.ownerPrivate();
            }
            return generic.info(getAction(root.group.retrieve, aGroup._id), aGroup.name);
          },
          clazz: 'item-col-author'
        },
        {
          title: 'Owner',
          prop: function(item) {
            switch (parseInt(item.owner)) {
              case 1:
                return generic.ownerPublic();
              case 2:
                return generic.ownerPrivate();
            }
          },
          clazz: 'item-col-author'
        },
        {
          title: 'Create',
          prop: 'create_time',
          clazz: 'item-col-date',
          type: 'date'
        }
      ];

      var envQryOptions = [];
      _.each(result.env, function (aEnv) {
        envQryOptions.push({
          val: aEnv.id,
          text: aEnv.name
        });
      });

      var groupQryOptions = [];
      _.each(result.group, function (aGroup) {
        groupQryOptions.push({
          val: aGroup.id,
          text: aGroup.name
        });
      });

      var search = [
        generic.searchSelect('env_id', 'All Environment', envQryOptions),
        generic.searchSelect('group_id', 'All Group', groupQryOptions),
        generic.searchInput('id', 'search id...'),
        generic.searchInput('name', 'search server...')
      ];

      generic.list({
        ownerQuery: 1,
        defines: defines,
        search: search,
        queryHandle: function(realQry, qry) {
          if (realQry['env_id']) {
            realQry['env_id'] = parseInt(qry['env_id']);

            if (!req.user.isAdmin && result.envIds.indexOf(realQry.env_id) == -1) {
              realQry.env_id = -1;
            }
          } else {
            _.extend(realQry, {
              env_id: {
                $in: result.envIds
              }
            });
          }

          if (realQry['group_id']) {
            realQry['group_id'] = parseInt(qry['group_id']);

            if (!req.user.isAdmin && result.groupIds.indexOf(realQry.group_id) == -1) {
              realQry.group_id = -1;
            }
          } else {
            _.extend(realQry, {
              group_id: {
                $in: result.groupIds
              }
            });
          }

        }
      }, req, res, next);
    });
  });

  /**
   * Server editor
   */
  router.get(index.editor.do, function (req, res, next) {
    async.waterfall([
      function (callback) {
        Environment.find(generic.envOwnerQuery(req)).sort({_id: -1}).toArray(function (err, items) {
          var envData = [];
          items = _.orderBy(items, ['order', 'id'], ['asc', 'desc']);
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
        Group.find(generic.groupOwnerQuery(req)).sort({_id: -1}).toArray(function (err, items) {
          var groupData = [];
          items = _.orderBy(items, ['order', 'id'], ['asc', 'desc']);
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
      generic.editor({
        schemaExclude: ['create_by','env_id','group_id','env_order','group_order','request.add_params_doc'],
        tabs: [
          {
            tabName: 'Additional Parameter',
            form: generic.formEl(addParamsEl)
          }
        ],
        defineElement: {
          owner: {
            selected: 1,
            el: 'radio',
            inline: 1
          }
        },
        formElHandle: function(form) {
          var theEnv = generic.selectEl('env_id', {
            label: 'Environment',
            options: result.env
          });
          var theGroup = generic.selectEl('group_id', {
            label: 'Group',
            options: result.group
          });

          form.afterEl('home_url', theEnv);
          form.afterEl('env_id', theGroup);
        }
      }, req, res, next);
    });
  });

  /**
   * Server create
   */
  router.post(index.editor.do, function (req, res, next) {
    generic.create({
      sequenceId: 1,
      checkExistsField: [ 'url', 'request.method' ],
      paramHandle: function(item) {
        item.owner = parseInt(item.owner);
        item.request.type = parseInt(item.request.type);
        item.request.data_type = parseInt(item.request.data_type);
        item.env_id = parseInt(item.env_id);
        item.group_id = parseInt(item.group_id);
        item.create_by = {
          id: req.user.id,
          name: req.user.name
        };
        if (2 == item.request.type && '' == item.request.param_name) {
          res.json(answer.fail('Parameter name must provide if Multi-interface'));
          return generic.BREAK;
        }

        if (item.home_url && !isURL(item.home_url)) {
          res.json(answer.fail('The login URL is not valid'));
          return generic.BREAK;
        }

        item.env_order = DEFAULT_ORDER;
        item.group_order = DEFAULT_ORDER;

        if (req.body.request_add_params) {
          item.request.add_params_doc = req.body.request_add_params;
          var dec = crypto.decompress(req.body.request_add_params);
          try {
            item.request.add_params = json5s.parse(dec);
          } catch(e) {
            res.json(answer.fail('Additional Parameter is not a valid JSON'));
            return generic.BREAK;
          }
        } else {
          item.request.add_params = {};
        }
      },
      beforeCreateHandle: function(item, callback) {
        Environment.find({id: item.env_id}).limit(1).next(function(err, env) {
          item.env_order = env.order;

          Group.find({id: item.group_id}).limit(1).next(function(err, group) {
            item.group_order = group.order;

            callback(null, item);
          });
        });
      }
    }, req, res, next);
  });

  /**
   * Server update
   */
  router.put(index.retrieve.do, function (req, res, next) {
    generic.update({
      checkExistsField: [ 'url', 'request.method' ],
      paramHandle: function(item) {
        item.owner = parseInt(item.owner);
        item.request.type = parseInt(item.request.type);
        item.request.data_type = parseInt(item.request.data_type);
        item.env_id = parseInt(item.env_id);
        item.group_id = parseInt(item.group_id);
        item.create_by = {
          id: req.user.id,
          name: req.user.name
        };
        if (2 == item.request.type && '' == item.request.param_name) {
          res.json(answer.fail('Parameter name must provide if Multi-interface'));
          return generic.BREAK;
        }

        if (item.home_url && !isURL(item.home_url)) {
          res.json(answer.fail('The login URL is not valid'));
          return generic.BREAK;
        }

        item.env_order = DEFAULT_ORDER;
        item.group_order = DEFAULT_ORDER;

        if (req.body.request_add_params) {
          item.request.add_params_doc = req.body.request_add_params;
          var dec = crypto.decompress(req.body.request_add_params);
          try {
            item.request.add_params = json5s.parse(dec);
          } catch(e) {
            res.json(answer.fail('Additional Parameter is not a valid JSON'));
            return generic.BREAK;
          }
        } else {
          item.request.add_params = {};
        }
      },
      beforeUpdateHandle: function(target, itemObj, callback) {
        Environment.find({id: itemObj.env_id}).limit(1).next(function(err, env) {
          target.env_order = env.order;

          Group.find({id: itemObj.group_id}).limit(1).next(function(err, group) {
            target.group_order = group.order;

            callback(null, target, itemObj);
          });
        });
      }
    }, req, res, next);
  });

  /**
   * Server retrieve
   */
  router.get(index.retrieve.do, function (req, res, next) {
    async.waterfall([
      function (callback) {
        Environment.find(generic.envOwnerQuery(req)).sort({_id: -1}).toArray(function (err, items) {
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
        Group.find(generic.groupOwnerQuery(req)).sort({_id: -1}).toArray(function (err, items) {
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
      generic.retrieve({
        schemaExclude: ['create_by','env_id','group_id','env_order','group_order','request.add_params_doc'],
        tabs: [
          {
            tabName: 'Additional Parameter',
            form: generic.formEl(addParamsEl)
          }
        ],
        defineElement: {
          owner: {
            el: 'radio',
            inline: 1
          }
        },
        resultHandle: function(result, respdata) {
          respdata.env_id = result.env_id;
          respdata.group_id = result.group_id;
        },
        formElHandle: function(form) {
          var theEnv = generic.selectEl('env_id', {
            label: 'Environment',
            options: result.env
          });
          var theGroup = generic.selectEl('group_id', {
            label: 'Group',
            options: result.group
          });

          form.afterEl('home_url', theEnv);
          form.afterEl('env_id', theGroup);
        },
        additionHandle: function(item, addition) {
          if (item.request.add_params_doc) {
            addition.request_add_params = item.request.add_params_doc;
          }
        }
      }, req, res, next);
    });

  });

  /**
   * Server delete
   */
  router.delete(index.retrieve.do, function (req, res, next) {
    generic.delete({}, req, res, next);
  });

};

