'use strict';

var ShareAccess = app_require('models/share_access'),
  log = log_from('share-accesses');

module.exports = function (router, index, root) {

  var generic = app_require('helpers/generic')(ShareAccess, index, {
    element: {}
  });

  function previewHref(item) {
    return generic.previewHref('/share/' + crypto.compress(item.share),
      generic.em('eye') + ' ' + (item.share_id || ''), 'View Share ' + item.share).replace('data-preview', '');
  }

  /**
   * Share Access list
   */
  router.get(index.do, function (req, res, next) {
    var defines = [
      {
        title: 'Share',
        prop: function(item) {
          return previewHref(item);
        },
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
            return generic.info(getAction(root.users.retrieve, aUser.id), aUser.name);
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
              return generic.info('/share/preview?data=' + data, 'Execute ' + item.history, 'none');
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
        title: 'Create',
        prop: 'create_time',
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
      generic.searchSelect('share_read_write', 'All Access', rwQryOptions),
      generic.searchSelect('type', 'All Type', typeQryOptions)
    ];

    generic.list({
      itemAction: 0,
      ownerQuery: 1,
      defines: defines,
      search: search,
      queryHandle: function(realQry, qry) {
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

