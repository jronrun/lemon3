'use strict';

var Note = app_require('models/note'),
  log = log_from('notes');

module.exports = function (router, index, root) {

  var generic = app_require('helpers/generic')(Note, index, {
    element: {
      content: {
        el: 'textarea',
        attrs: {
          rows: 12
        }
      },
      summary: {
        el: 'textarea',
        attrs: {
          rows: 5
        }
      },
      note: {
        el: 'textarea'
      }
    }
  });

  /**
   * Note list
   */
  router.get(index.do, function (req, res, next) {
    var defines = [
      {
        title: 'Title',
        prop: function(item) {
          return generic.title(item.title, getAction(root.mnote.retrieve, item._id), item.id);
        },
        clazz: 'fixed pull-left item-col-title'
      },
      {
        title: 'Summary',
        prop: function (item) {
          return _.escape(item.summary);
        },
        clazz: 'item-col-author'
      },
      {
        title: 'Note',
        prop: function (item) {
          return _.escape(item.note);
        },
        clazz: 'item-col-author linebreak'
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
      generic.searchInput('title', 'search note...')
    ];

    generic.list({
      ownerQuery: 1,
      defines: defines,
      search: search,
      queryHandle: function(realQuery, query) {
        if (realQuery.title) {
          var likeKey = realQuery.title;
          _.extend(realQuery, {
            $or:[
              { title: likeKey},
              { summary: likeKey},
              { note: likeKey}
            ]
          });

          delete realQuery.title;
        }
      }
    }, req, res, next);

  });

  /**
   * Note editor
   */
  router.get(index.editor.do, function (req, res, next) {
    generic.editor({
      schemaExclude: ['create_by', 'state'],
      formElHandle: function (forms) {

      }
    }, req, res, next);
  });

  /**
   * Note create
   */
  router.post(index.editor.do, function (req, res, next) {
    generic.create({
      sequenceId: 1,
      checkExistsField: ['title', 'create_by.id'],
      paramHandle: function(item) {
        item.state = 1;
        item.tags = [];
        item.content = crypto.compress(item.content);
        item.create_by = {
          id: req.user.id,
          name: req.user.name
        }
      }
    }, req, res, next);
  });

  /**
   * Note update
   */
  router.put(index.retrieve.do, function (req, res, next) {
    generic.update({
      checkExistsField: ['title', 'create_by.id'],
      paramHandle: function(item) {
        item.state = parseInt(item.state);
        item.content = crypto.compress(item.content);
      }
    }, req, res, next);
  });

  /**
   * Note retrieve
   */
  router.get(index.retrieve.do, function (req, res, next) {
    generic.retrieve({
      schemaExclude: ['create_by'],
      resultHandle: function(result, respdata) {
        respdata.content = crypto.decompress(respdata.content)
      }
    }, req, res, next);
  });

  /**
   * Note delete
   */
  router.delete(index.retrieve.do, function (req, res, next) {
    generic.delete({}, req, res, next);
  });

};

