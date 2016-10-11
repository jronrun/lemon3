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

  function previewHref(item) {
    return generic.previewHref('/note/' + crypto.compress(item._id.toString()), generic.em('edit'), 'View ' + item.title)
  }

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
        clazz: 'item-col-author linebreak'
      },
      {
        title: 'Note',
        prop: function (item) {
          return _.escape(item.note);
        },
        clazz: 'item-col-author linebreak'
      },
      {
        title: 'State',
        prop: function(item) {
          return generic.getSchema('state').const[item.state];
        },
        clazz: 'item-col-author'
      },
      {
        title: 'Manual',
        prop: function(item) {
          var html = [
            previewHref(item)
          ];

          return html.join('');
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

    var stateOptions = [];
    _.each(generic.getSchema('state').const, function (v, k) {
      stateOptions.push({
        val: k,
        text: v
      });
    });

    var search = [
      generic.searchInput('id', 'search id...'),
      generic.searchInput('title', 'search note...')
    ];

    if (req.user.isAdmin) {
      search.push(generic.searchSelect('state', 'All State', stateOptions));
    }

    generic.list({
      ownerQuery: 1,
      defines: defines,
      search: search,
      queryHandle: function(realQuery, query) {
        if (realQuery.state) {
          realQuery.state = parseInt(query.state);
        }
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
        forms.get('language.name').value = 'Plain Text';
        forms.get('language.mime').value = 'text/plain';
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
      },
      formElHandle: function(forms) {
        var theTitle = forms.get('title');
        theTitle.label = [
          'Title ',
          previewHref(forms.item)
        ].join(' ');
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

