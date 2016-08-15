'use strict';

var ShareAccess = app_require('models/share_access'),
  log = log_from('share-accesses');

module.exports = function (router, index, root) {

  var generic = app_require('helpers/generic')(ShareAccess, index, {
    element: {}
  });

  /**
   * Share Access list
   */
  router.get(index.do, function (req, res, next) {
    var defines = [
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
      generic.searchInput('name', 'search history...')
    ];

    generic.list({
      itemAction: 0,
      ownerQuery: 1,
      defines: defines,
      search: search
    }, req, res, next);

  });

};

