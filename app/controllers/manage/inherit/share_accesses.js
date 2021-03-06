'use strict';

var ShareAccess = app_require('models/share_access'),
  log = log_from('share-accesses');

module.exports = function (router, index, root) {

  var generic = app_require('helpers/generic')(ShareAccess, index, {
    element: {}
  });

  function shareHref(shareId) {
    return generic.previewHref('/share/' + crypto.compress(shareId), generic.em('eye') + ' Share', 'View Share');
  }

  /**
   * Share Access list
   */
  router.get(index.do, function (req, res, next) {
    var defines = [
      {
        title: 'Type',
        prop: function(item) {
          return generic.getSchema('type').const[item.type];
        },
        clazz: 'item-col-author'
      },
      {
        title: 'Access as',
        prop: function(item) {
          return generic.getSchema('share_read_write').const[item.share_read_write];
        },
        clazz: 'item-col-author'
      },
      {
        title: 'Access By',
        prop: function(item) {
          var aUser = item.create_by;
          if (aUser.name && 'anonymous' != aUser.name
            && aUser.id && '-1' != aUser.id) {
            var html = [
              generic.info(getAction(root.users.retrieve, aUser.id), aUser.name),
            ];

            if (aUser.ip && aUser.ip.length > 0) {
              html.push(' <span style="font-size: 70%;">(' + aUser.ip + ')</span>');
            }

            return html.join('');
          }

          return aUser.ip;
        },
        clazz: 'item-col-author'
      },
      {
        title: 'Content',
        prop: function(item) {
          switch (item.type) {
            case 1:
              return '';
            case 2:
              var data = crypto.compress({
                type: 3,
                preview: 0,
                content: item.history
              });
              return generic.info('/share/preview?data=' + data, 'Execute ' + item.history, 'preview');
            case 3:
            case 4:
              return [
                '<span style="font-size: 70%">',
                item.fail,
                '</span>'
              ].join('');

          }
        },
        clazz: 'item-col-author'
      },
      {
        title: 'Share Create',
        prop: function(item) {
          var createT = datefmt(item.create_time);
          if (req.user.isAdmin) {
            var text = '<span title="' + item.share_user_id + '">' + createT + '</span>';
            return generic.info(getAction(root.users.retrieve, item.share_user_id), text);
          }

          return createT;
        },
        clazz: 'item-col-date',
        type: 'date'
      }
    ];

    var rwQryOptions = [];
    _.each(generic.getSchema('share_read_write.const'), function (v, k) {
      rwQryOptions.push({
        val: k,
        text: v
      });
    });

    var typeQryOptions = [];
    _.each(generic.getSchema('type.const'), function (v, k) {
      typeQryOptions.push({
        val: k,
        text: v
      });
    });

    var search = [
      generic.searchInput('share', '', 1),
      generic.searchInput('create_by.ip', 'User IP'),
      generic.searchInput('create_by.name', 'User Name'),
      generic.searchSelect('share_read_write', 'All Access', rwQryOptions),
      generic.searchSelect('type', 'All Type', typeQryOptions)
    ];

    generic.list({
      itemAction: 0,
      ownerQuery: 1,
      defines: defines,
      search: search,
      queryHandle: function(realQry, qry, options) {
        var shareId = qry['share'], backHref = '/manage/shares/1', validShareId = false;

        if (!shareId || shareId.length < 1) {
          realQry['share'] = '-1';
        } else {
          validShareId = true;
          if (req.reference && req.reference.length > 0 && req.reference.indexOf('/share/') > 0) {
            backHref = '/manage/share/' + shareId;
          }

          realQry['share'] = shareId;
        }

        var listName = [
          'Share Access',
          '<h4 class="invisible"></h4>',
          format('<a class="btn btn-primary btn-sm icondh" data-pjax href="%s" role="button">', backHref),
          '<em class="fa fa-chevron-left"></em>',
          '</a>'
        ];

        if (validShareId) {
          listName.push(shareHref(shareId));
        }

        options.listName = listName.join('');

        if (realQry['share_read_write']) {
          realQry['share_read_write'] = parseInt(qry['share_read_write']);
        }

        if (realQry['type']) {
          realQry['type'] = parseInt(qry['type']);
        }
      }
    }, req, res, next);

  });

};

