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
        desc: 'Opened count if readonly, Requested count if read write, Unlimited if count is -1'
      },
      used_count: {
        label: 'Used Requested Count'
      },

      start_time: {
        label: 'Start time'
      },
      end_time: {
        label: 'End time'
      }
    }
  });

  var paramHandleCU = function(item, req) {
    item.share_to.anonymous = parseInt(item.share_to.anonymous);
    item.share_to.scope = parseInt(item.share_to.scope);
    var shareToDefine = [];
    _.each((item.share_to.define || '').split(','), function (v) {
      if (v && v.length > 0) {
        shareToDefine.push(v);
      }
    });
    item.share_to.define = shareToDefine;

    item.count = parseInt(item.count);
    item.used_count = parseInt(item.used_count || '0');
    item.read_write = parseInt(item.read_write);
    item.type = parseInt(item.type);
    item.state = 1;

    item.create_by = {
      id: req.user.id,
      name: req.user.name,
      ip: req.ip
    }
  };

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
      formElHandle: function(forms) {
        var scopeDefine = generic.textareaEl('share_to.define', {
          label: 'Define',
          desc: 'Client IP if Anonymous, User email if Login User'
        });

        forms.afterEl('share_to.scope', scopeDefine);
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
        paramHandleCU(item, req);
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
        paramHandleCU(item, req);
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

