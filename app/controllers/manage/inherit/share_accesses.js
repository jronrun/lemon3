'use strict';

var ShareAccess = app_require('models/share_access'),
  log = log_from('share-accesses');

module.exports = function (router, index, root) {

  var generic = app_require('helpers/generic')(ShareAccess, index, {
    element: {}
  });

  function previewHref(item) {
    return generic.previewHref('/share/' + crypto.compress(item.share), generic.em('eye') + ' ' + item.share_id, 'View Share');
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
          if (aUser.name && aUser.id) {
            return generic.info(getAction(root.users.retrieve, aUser.id), aUser.name);
          }

          return aUser.ip;
        },
        clazz: 'item-col-author'
      },
      {
        title: 'Content',
        prop: function(item) {
          if (1 == item.share_read_write || !item.history) {
            return '';
          }

          var data = crypto.compress({
            type: 3,
            preview: 0,
            content: item.history
          });
          return generic.info('/share/preview?data=' + data, 'Execute ' + item.history, 'preview');
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

    var search = [
      generic.searchInput('share', '', 1),
      generic.searchSelect('share_read_write', 'All Access', rwQryOptions)
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
      }
    }, req, res, next);

  });

};

