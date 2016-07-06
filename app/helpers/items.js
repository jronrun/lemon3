'use strict';

var log = log_from('items');

var types = {
  date: function(val) {
    return val ? datefmt(val) : val;
  }
};

var helper = {

  ownScope: function(usr, property, target) {
    if (usr.isAdmin) {
      return true;
    }

    target = parseInt(target || '-1');
    var defined = usr[property] || {};
    if (!defined.scope) {
      defined.scope = 3;
    }

    //1: 'Include All'
    if (1 == defined.scope) {
      return true;
    }

    //2: 'Include only in Define'
    else if (2 == defined.scope) {
      return _.indexOf(defined.define || [], target) != -1;
    }

    //3: 'Exclude All'
    else if (3 == defined.scope) {
      return false;
    }

    //4: 'Exclude only in Define'
    else if (4 == defined.scope) {
      return _.indexOf(defined.define || [], target) == -1;
    }
  },

  ownIds: function(usr, property, target) {
    if (usr.isAdmin) {
      return true;
    }

    target = parseInt(target || '-1');
    return _.indexOf(usr[property] || [], target) != -1;
  },

  ownEnv: function(usr, target) {
    return helper.ownIds(usr, 'env', target);
  },

  ownGroup: function(usr, target) {
    return helper.ownIds(usr, 'group', target);
  },

  ownServer: function(usr, target) {
    return helper.ownScope(usr, 'server', target);
  },

  ownInterface: function(usr, target) {
    return helper.ownScope(usr, 'interface', target);
  },

  /**
   *  defined: {
   *     scope: 1
   *     define: []
   *  }
   * @see power.sourceDefineConst
   * @param req
   * @param property
   * @returns {{}}
   */
  scopeOwnerQuery: function(req, property) {
    var aUser = req.user || {};
    if (aUser.isAdmin) {
      return {};
    }

    var defined = aUser[defined] || {};
    if (!defined.scope) {
      defined.scope = 3;
    }

    //1: 'Include All'
    if (1 == defined.scope) {
      return {};
    }

    //2: 'Include only in Define'
    else if (2 == defined.scope) {
      return {
        $or:[
          { id: {$in: (defined.define || []) }},
          { "create_by.id": aUser.id, owner: 2 }
        ]
      };
    }

    //3: 'Exclude All'
    else if (3 == defined.scope) {
      return { id: -1 };
    }

    //4: 'Exclude only in Define'
    else if (4 == defined.scope) {
      return {
        $or:[
          { id: {$nin: (defined.define || []) }},
          { "create_by.id": aUser.id, owner: 2 }
        ]
      };
    }
  },

  idsOwnerQuery: function(req, property) {
    var aUser = req.user || {};
    if (aUser.isAdmin) {
      return {};
    }

    var itemIds = aUser[property] || [];
    return {
      $or:[
        { id: {$in: itemIds }},
        { "create_by.id": aUser.id, owner: 2 }
      ]
    };
  },

  envOwnerQuery: function(req) {
    return helper.idsOwnerQuery(req, 'env');
  },

  groupOwnerQuery: function(req) {
    return helper.idsOwnerQuery(req, 'group');
  },

  serverOwnerQuery: function(req) {
    return helper.scopeOwnerQuery(req, 'server');
  },

  interfaceOwnerQuery: function(req) {
    return helper.scopeOwnerQuery(req, 'interface');
  },

  /**
   * For manage
   * @param define
   * [{
          "title": "",
          "clazz": "",
          "prop": "",       //model field name or function(item) {}
          "type": ""        //pre defined type
      }]
   * @param items
   * @returns
   * {
   *  defines: defines,
   *  items: [
   *    {
   *      id: 1,
   *      row: [
            {
              "title": "",
              "value": "",
              "clazz": "",
              "prop": ""
            }
          ]
   *    }
   *  ]
   * }
     */
  asShowData: function(defines, items) {
    var data = [];

    _.each(items || [], function (item) {
      var row = [];

      _.each(defines || [], function(define) {
        var val = _.isFunction(define.prop) ? define.prop(item) : (
          types[define.type] ? types[define.type](item[define.prop]) : item[define.prop]
        );

        row.push({
          title: define.title,
          clazz: define.clazz || '',
          value: val
        });
      });

      data.push({
        id: item['_id'],
        numId: item.id || 0,
        row: row
      });
    });

    return {
      defines: defines,
      items: data
    };
  }
};

module.exports = helper;
