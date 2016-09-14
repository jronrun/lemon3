'use strict';

var Tag = app_require('models/tag'),
  Server = app_require('models/api/server'),
  log = log_from('tags');

module.exports = function (router, index, root) {

  var generic = app_require('helpers/generic')(Tag, index, {
    element: {
      desc: {
        label: 'Description'
      },
      color: {
        el: 'input',
        attrs: {
          type: 'color'
        }
      }
    }
  });

  /**
   * Tag list
   */
  router.get(index.do, function (req, res, next) {
    var defines = [
      {
        title: 'Name',
        prop: function(item) {
          return generic.title(item.name, getAction(root.tag.retrieve, item._id), item.id);
        },
        clazz: 'fixed pull-left item-col-title'
      },
      {
        title: 'Description',
        prop: 'desc',
        clazz: 'item-col-author'
      },
      {
        title: 'Type',
        prop: function(item) {
          return generic.getSchema('type').const[item.type];
        },
        clazz: 'item-col-author'
      },
      {
        title: 'Color',
        prop: function(item) {
          var fill = '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;';
          return format('<span class="tag tag-default" style="background-color:%s">%s</span>', item.color, fill);
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
      generic.searchInput('name', 'search tag...')
    ];

    generic.list({
      ownerQuery: 1,
      defines: defines,
      search: search
    }, req, res, next);

  });

  /**
   * Tag editor
   */
  router.get(index.editor.do, function (req, res, next) {
    generic.editor({
      schemaExclude: ['create_by'],
      formElHandle: function (forms) {

      }
    }, req, res, next);
  });

  /**
   * Tag create
   */
  router.post(index.editor.do, function (req, res, next) {
    generic.create({
      sequenceId: 1,
      checkExistsField: ['name', 'create_by.id'],
      paramHandle: function(item) {
        item.type = parseInt(item.type);
        item.create_by = {
          id: req.user.id,
          name: req.user.name
        }
      }
    }, req, res, next);
  });

  /**
   * Tag update
   */
  router.put(index.retrieve.do, function (req, res, next) {
    generic.update({
      checkExistsField: ['name', 'create_by.id'],
      paramHandle: function(item) {
        item.type = parseInt(item.type);
      }
    }, req, res, next);
  });

  /**
   * Tag retrieve
   */
  router.get(index.retrieve.do, function (req, res, next) {
    generic.retrieve({
      schemaExclude: ['create_by']
    }, req, res, next);
  });

  /**
   * Tag delete
   */
  router.delete(index.retrieve.do, function (req, res, next) {
    generic.delete({}, req, res, next);
  });

};

