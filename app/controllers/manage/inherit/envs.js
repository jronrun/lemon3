'use strict';

var Environment = app_require('models/api/env'),
  Server = app_require('models/api/server'),
  log = log_from('envs');

module.exports = function (router, index, root) {

  var generic = app_require('helpers/generic')(Environment, index, {
    element: {
      desc: {
        label: 'Description'
      },
      alert_level: {
        label: 'Alert Level'
      }
    }
  });

  /**
   * Environment list
   */
  router.get(index.do, function (req, res, next) {
    var defines = [
      {
        title: 'Name',
        prop: function(item) {
          return generic.title(item.name, getAction(root.env.retrieve, item._id), item.id);
        },
        clazz: 'fixed pull-left item-col-title'
      },
      {
        title: 'Description',
        prop: 'desc',
        clazz: 'item-col-author'
      },
      {
        title: 'Alert Level',
        prop: function(item) {
          return format('<span class="label label-%s">%s</span>', item.alert_level, item.alert_level);
        },
        clazz: 'item-col-author'
      },
      {
        title: 'Order',
        prop: 'order',
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
        title: 'Create By',
        prop: function(item) {
          var aUser = item.create_by;
          return generic.info(getAction(root.users.retrieve, aUser.id), aUser.name);
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

    var search = [
      generic.searchInput('id', 'search id...'),
      generic.searchInput('name', 'search environment...')
    ];

    generic.list({
      ownerQuery: 1,
      defines: defines,
      search: search
    }, req, res, next);

  });

  /**
   * Environment editor
   */
  router.get(index.editor.do, function (req, res, next) {
    generic.editor({
      schemaExclude: ['create_by'],
      defineElement: {
        owner: {
          selected: 1,
          el: 'radio',
          inline: 1
        }
      },
      resultHandle: function(item, respData) {
        respData.order = DEFAULT_ORDER;
      }
    }, req, res, next);
  });

  /**
   * Environment create
   */
  router.post(index.editor.do, function (req, res, next) {
    generic.create({
      sequenceId: 1,
      checkExistsField: 'name',
      paramHandle: function(item) {
        item.owner = parseInt(item.owner);
        item.order = parseInt(item.order);
        item.create_by = {
          id: req.user.id,
          name: req.user.name
        }
      }
    }, req, res, next);
  });

  /**
   * Environment update
   */
  router.put(index.retrieve.do, function (req, res, next) {
    generic.update({
      checkExistsField: 'name',
      paramHandle: function(item) {
        item.owner = parseInt(item.owner);
        item.order = parseInt(item.order);
      },
      afterUpdateHandle: function(target, itemObj, callback) {
        Server.updateMany({
          env_id : itemObj.id
        }, {
          $set: {
            env_order: itemObj.order
          }
        }, {
          multi: true
        }, function(r) {
          callback(null, target);
        });
      }
    }, req, res, next);
  });

  /**
   * Environment retrieve
   */
  router.get(index.retrieve.do, function (req, res, next) {
    generic.retrieve({
      schemaExclude: ['create_by'],
      defineElement: {
        owner: {
          el: 'radio',
          inline: 1
        }
      }
    }, req, res, next);
  });

  /**
   * Environment delete
   */
  router.delete(index.retrieve.do, function (req, res, next) {
    generic.delete({}, req, res, next);
  });

};

