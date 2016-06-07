'use strict';

var Server = app_require('models/api/server'),
  log = log_from('servers');

module.exports = function (router, index, root) {

  var generic = app_require('helpers/generic')(Server, index, {
    element: {
      param_name: {
        label: 'Parameter Name'
      },
      interf_prop: {
        label: 'Interface Property'
      },
      data_type: {
        label: 'Data Type'
      },
      desc: {
        label: 'Description'
      }
    }
  });

  /**
   * Server list
   */
  router.get(index.do, function (req, res, next) {
    var defines = [
      {
        title: 'Name',
        prop: function(item) {
          return generic.title(item.name, getAction(root.server.retrieve, item._id));
        },
        clazz: 'fixed pull-left item-col-title'
      },
      {
        title: 'Description',
        prop: 'desc',
        clazz: 'item-col-author'
      },
      {
        title: 'Owner',
        prop: function(item) {
          switch (parseInt(item.owner)) {
            case 1:
              return '<span class="text-success"><em class="fa fa-users"></em> ' + 'Public</span>';
            case 2:
              return '<span class="text-warning"><em class="fa fa-shield"></em> ' + 'Private</span>';
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
      generic.searchInput('name', 'search server...')
    ];

    generic.list({
      defines: defines,
      search: search
    }, req, res, next);

  });

  /**
   * Server editor
   */
  router.get(index.editor.do, function (req, res, next) {
    generic.editor({
      schemaExclude: ['create_by','env_id','group_id'],
      defineElement: {
        owner: {
          selected: 1,
          el: 'radio',
          inline: 1
        }
      }
    }, req, res, next);
  });

  /**
   * Server create
   */
  router.post(index.editor.do, function (req, res, next) {
    generic.create({
      sequenceId: 1,
      checkExistsField: 'name',
      paramHandle: function(item) {
        item.owner = parseInt(item.owner);
        item.create_by = {
          id: req.user.id,
          name: req.user.name
        }
      }
    }, req, res, next);
  });

  /**
   * Server update
   */
  router.put(index.retrieve.do, function (req, res, next) {
    userReourceCacheReset();
    generic.update({
      checkExistsField: 'name',
      paramHandle: function(item) {
        item.owner = parseInt(item.owner);
      }
    }, req, res, next);
  });

  /**
   * Server retrieve
   */
  router.get(index.retrieve.do, function (req, res, next) {
    generic.retrieve({
      schemaExclude: ['create_by','env_id','group_id'],
      defineElement: {
        owner: {
          el: 'radio',
          inline: 1
        }
      }
    }, req, res, next);
  });

  /**
   * Server delete
   */
  router.delete(index.retrieve.do, function (req, res, next) {
    generic.delete({}, req, res, next);
  });

};

