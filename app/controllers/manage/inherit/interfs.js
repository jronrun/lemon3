'use strict';

var Interface = app_require('models/api/interf'),
  log = log_from('interfs');

module.exports = function (router, index, root) {

  var generic = app_require('helpers/generic')(Interface, index, {
    element: {
      desc: {
        label: 'Description'
      }
    }
  });

  /**
   * Interface list
   */
  router.get(index.do, function (req, res, next) {
    var defines = [
      {
        title: 'Name',
        prop: function(item) {
          return generic.title(item.name, getAction(root.interface.retrieve, item._id));
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
      generic.searchInput('name', 'search interface...')
    ];

    generic.list({
      defines: defines,
      search: search
    }, req, res, next);

  });

  /**
   * Interface editor
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
      }
    }, req, res, next);
  });

  /**
   * Interface create
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
   * Interface update
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
   * Interface retrieve
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
   * Interface delete
   */
  router.delete(index.retrieve.do, function (req, res, next) {
    generic.delete({}, req, res, next);
  });

};

