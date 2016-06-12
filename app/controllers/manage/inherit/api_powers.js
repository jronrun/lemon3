'use strict';

var Power = app_require('models/power'),
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
    generic.editor({
      schemaExclude: ['resources', 'type']
    }, req, res, next);
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
      schemaExclude: ['resources', 'type']
    }, req, res, next);
  });

  /**
   * API Power delete
   */
  router.delete(index.retrieve.do, function (req, res, next) {
    generic.delete({}, req, res, next);
  });

};

