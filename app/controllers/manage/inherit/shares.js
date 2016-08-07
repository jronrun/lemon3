'use strict';

var Share = app_require('models/share'),
  log = log_from('shares');

module.exports = function (router, index, root) {

  var generic = app_require('helpers/generic')(Share, index, {
    element: {
      title: {
        label: 'Title'
      },
      desc: {
        label: 'Description'
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
    item.content = crypto.compress(item.content);

    var time = null;
    item.start_time = generic.getPickerDate(item, 'start_time');
    item.end_time = generic.getPickerDate(item, 'end_time');

    item.create_by = {
      id: req.user.id,
      name: req.user.name,
      ip: req.ip
    }
  };

  function shareHref(item, readonly) {
    var sData = crypto.compress(Share.shareData(item, readonly));
    var html = [
      format('<a class="btn btn-secondary text-info icondh" data-share="%s" title="Share Link" href="javascript:void(0);" ' +
        'style="border: 0px;" type="button">', sData),
      generic.em('share-alt'),
      '</a>'
    ];

    return html.join('');
  }

  function previewHref(item) {
    return generic.previewHref('/share/' + crypto.compress(item._id.toString()), generic.em('eye'), 'View ' + item.title);
  }

  /**
   * Share list
   */
  router.get(index.do, function (req, res, next) {
    var defines = [
      {
        title: 'Title',
        prop: function(item) {
          return generic.title(item.title, getAction(root.share.retrieve, item._id), item.id);
        },
        clazz: 'fixed pull-left item-col-title'
      },
      {
        title: 'Type',
        prop: function(item) {
          return generic.getSchema('type').const[item.type];
        },
        clazz: 'item-col-author'
      },
      {
        title: 'Read Write',
        prop: function(item) {
          return generic.getSchema('read_write').const[item.read_write];
        },
        clazz: 'item-col-author'
      },
      {
        title: 'Count',
        prop: function(item) {
          return item.used_count + ' / ' + item.count;
        },
        clazz: 'item-col-author'
      },
      {
        title: 'Periods of Time',
        prop: function(item) {
          return datefmt(item.start_time, 'YYYY-MM-DD HH:mm') + ' to ' + datefmt(item.end_time, 'YYYY-MM-DD HH:mm');
        },
        clazz: 'item-col-author'
      },
      {
        title: 'Share To',
        prop: function(item) {
          var text = [
            '<span style="font-size: 70%">',
            generic.getSchema('share_to.properties.anonymous').const[item.share_to.anonymous],
            '<br/>',
            generic.getSchema('share_to.properties.scope').const[item.share_to.scope],
            '</span>'
          ];
          return text.join('');
        },
        clazz: 'item-col-author'
      },
      {
        title: 'State',
        prop: function(item) {
          return generic.getSchema('state').const[item.state];
        },
        clazz: 'item-col-author'
      },
      {
        title: 'Create By',
        prop: function(item) {
          var aUser = item.create_by;
          return [
            generic.info(getAction(root.users.retrieve, aUser.id), aUser.name),
            '<br/>',
            datefmt(item.create_time)
          ].join('');
        },
        clazz: 'item-col-author'
      },
      {
        title: 'Manual',
        prop: function(item) {
          var html = [
            previewHref(item),
            shareHref(item)
          ];

          return html.join('');
        },
        clazz: 'item-col-author'
      }
    ];

    var search = [
      generic.searchInput('id', 'search id...'),
      generic.searchInput('title', 'search share...')
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

        forms.remOption('type', [2, 5, 7]);
      },
      resultHandle: function(item, def) {
        var now = moment().hours(0).minutes(0);
        item.start_time = now.toDate();
        item.end_time = now.clone().add(7, 'd').toDate();
        generic.setPickerDate(item, def, 'start_time');
        generic.setPickerDate(item, def, 'end_time');
      }
    }, req, res, next);
  });

  /**
   * Share create
   */
  router.post(index.editor.do, function (req, res, next) {
    generic.create({
      sequenceId: 1,
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
      formElHandle: function(forms) {
        var scopeDefine = generic.textareaEl('share_to.define', {
          label: 'Define',
          desc: 'Client IP if Anonymous, User email if Login User'
        });

        forms.afterEl('share_to.scope', scopeDefine);
        forms.remOption('type', [2, 5, 7]);

        var theContent = forms.get('content');
        if (6 != forms.item.type) {
          theContent.el = 'input';
          theContent.attrs.type = 'hidden';
          theContent.desc = '';
        }
        theContent.label = [
          'Share Content',
          previewHref(forms.item),
          shareHref(forms.item, true)
        ].join(' ');

        forms.disable(['type', 'used_count']);
      },
      resultHandle: function(item, def) {
        generic.setPickerDate(item, def, 'start_time');
        generic.setPickerDate(item, def, 'end_time');
        def.content = crypto.decompress(def.content);
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

