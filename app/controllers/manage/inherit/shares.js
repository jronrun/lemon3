'use strict';

var Share = app_require('models/share'),
  log = log_from('shares');

module.exports = function (router, index, root) {

  var generic = app_require('helpers/generic')(Share, index, {
    element: {
      title: {
        label: 'Title <span class="text-silver">[Optional]</span>'
      },
      desc: {
        label: 'Description <span class="text-silver">[Optional]</span>'
      },
      content: {
        label: 'Share Content',
        el: 'textarea',
        attrs: {
          rows: 5
        },
        desc: 'Reference ID if type is API, API History, Note'
      },
      share_to: {
        label: 'Share to'
      },
      read_write: {
        label: 'Read Write'
      },
      count: {
        label: 'Allowed Max Request Count',
        desc: 'Opened count if readonly, Requested count if read write'
      },
      used_count: {
        label: 'Used Requested Count'
      }
    }
  });

  /**
   * Share list
   */
  router.get(index.do, function (req, res, next) {
    var defines = [
      {
        title: 'Name',
        prop: function(item) {
          return generic.title(item.name, getAction(root.share.retrieve, item._id), item.id);
        },
        clazz: 'fixed pull-left item-col-title'
      },
      {
        title: 'Description',
        prop: 'desc',
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
      generic.searchInput('name', 'search share...')
    ];

    generic.list({
      ownerQuery: 1,
      defines: defines,
      search: search
    }, req, res, next);

  });

  /**
   * Share editor
   */
  router.get(index.editor.do, function (req, res, next) {
    generic.editor({
      schemaExclude: ['create_by', 'state', 'used_count'],
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
   * Share create
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
   * Share update
   */
  router.put(index.retrieve.do, function (req, res, next) {
    generic.update({
      checkExistsField: 'name',
      paramHandle: function(item) {
        item.owner = parseInt(item.owner);
        item.order = parseInt(item.order);
      }
    }, req, res, next);
  });

  /**
   * Share retrieve
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
   * Share delete
   */
  router.delete(index.retrieve.do, function (req, res, next) {
    generic.delete({}, req, res, next);
  });

};

