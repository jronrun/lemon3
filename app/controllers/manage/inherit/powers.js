'use strict';

var Power = app_require('models/power'),
  log = log_from('powers');

module.exports = function (router, index, root) {

  var generic = app_require('helpers/generic')(Power, index, {
    element: {
      desc: {
        label: 'Description'
      }
    }
  });

  /**
   * Power list
   */
  router.get(index.do, function (req, res, next) {
    var defines = [
      {
        title: 'Name',
        prop: function(item) {
          return generic.title(item.name, getAction(root.powers.retrieve, item._id));
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
      generic.searchInput('name', 'search power...')
    ];

    generic.list({
      defines: defines,
      search: search,
      queryHandle: function(query) {
        _.extend(query, {
          type: 1
        })
      }
    }, req, res, next);

  });

  /**
   * Power editor
   */
  router.get(index.editor.do, function (req, res, next) {
    generic.editor({
      schemaExclude: ['resources', 'type', 'env', 'group', 'server', 'interface'],
      resourceTab: 1,
      resourceAction: root.resource.action
    }, req, res, next);
  });

  /**
   * Power create
   */
  router.post(index.editor.do, function (req, res, next) {
    generic.create({
      resourceTab: 1,
      sequenceId: 1,
      checkExistsField: 'name',
      paramHandle: function(item) {
        item.type = 1;
      }
    }, req, res, next);
  });

  /**
   * Power update
   */
  router.put(index.retrieve.do, function (req, res, next) {
    userReourceCacheReset();
    generic.update({
      resourceTab: 1,
      checkExistsField: 'name',
      paramHandle: function(item) {
        item.type = 1;
      }
    }, req, res, next);
  });

  /**
   * Power retrieve
   */
  router.get(index.retrieve.do, function (req, res, next) {
    generic.retrieve({
      schemaExclude: ['resources', 'type', 'env', 'group', 'server', 'interface'],
      resourceTab: 1,
      resourceAction: actionWrap(root.resource.power.action, req.params.id).action
    }, req, res, next);
  });

  /**
   * Power delete
   */
  router.delete(index.retrieve.do, function (req, res, next) {
    generic.delete({}, req, res, next);
  });

};

