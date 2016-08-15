'use strict';

var log = log_from('items');

var types = {
  date: function(val) {
    return val ? datefmt(val) : val;
  }
};

var helper = {

  grantExecutableShare: function(anonymous, usr, shared) {
    var aUser = anonymous ? {
      env: [],
      group: [],
      server: {
        scope: 2,
        define: []
      },
      interface: {
        scope: 2,
        define: []
      }
    } : usr;

    if (aUser.isAdmin) {
      return aUser;
    }

    if (shared.env) {
      aUser.env.push(shared.env);
    }

    if (shared.group) {
      aUser.group.push(shared.group);
    }

    if (shared.serv) {
      aUser.server.define.push(shared.serv);
    }

    if (shared.api) {
      aUser.interface.define.push(shared.api);
    }

    return aUser;
  },

  getPickerDate: function(item, propName) {
    if (!item || !propName) {
      return null;
    }

    var dateVal = _.get(item, propName) || '';
    if (!dateVal || dateVal.length < 1) {
      return null;
    }

    var timeVal = _.get(item, propName + '_clock') || '';
    var target = dateVal + (timeVal.length > 0 ? (' ' + timeVal) : '');
    return moment(target).toDate();
  },

  setPickerDate: function(item, def, propName, dateType) {
    if (!item || !def || !propName) {
      return false;
    }

    var originDate = _.get(item, propName), aDate = '';

    if (_.isString(originDate)) {
      aDate = originDate;
    } else if (_.isDate(originDate)) {
      aDate = datefmt(originDate);
    } else {
      return false;
    }

    var tmp = aDate.split(' ');
    switch (dateType || 'datetime') {
      case 'datetime':
        if (tmp.length != 2) {
          return false;
        }

        _.set(def, propName, tmp[0]);
        _.set(def, propName + '_clock', _.beforeOccur(tmp[1], ':', 2));
        break;
      case 'date':
        if (tmp.length == 1 || tmp.length == 2) {
          _.set(def, propName, tmp[0]);
        } else {
          return false;
        }
        break;
      case 'time':
        var timeStr = '';
        if (tmp.length == 1) {
          timeStr = tmp[0];
        } else if (tmp.length == 2) {
          timeStr = tmp[1];
        } else {
          return false;
        }

        _.set(def, propName, _.beforeOccur(timeStr, ':', 2));
        break;
    }

    return true;
  },

  ownScope: function(usr, property, target) {
    usr = usr || {};
    if (usr.isAdmin) {
      return true;
    }

    target = parseInt(target || '-1');
    var defined = usr[property] || {};
    if (!defined.scope) {
      defined.scope = 3;
    }

    return inScope(defined, target);
  },

  ownIds: function(usr, property, target) {
    usr = usr || {};
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
   * @see comm.SCOPE_DEFINE
   * @param req
   * @param property
   * @returns {{}}
   */
  scopeOwnerQuery: function(req, property) {
    var aUser = req.user || {};
    if (aUser.isAdmin) {
      return {};
    }

    var defined = aUser[property] || {};
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
          { "create_by.id": aUser.id }
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
          { "create_by.id": aUser.id }
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
        { "create_by.id": aUser.id }
      ]
    };
  },

  selfOwnerQuery: function(req) {
    var aUser = req.user || {};
    if (aUser.isAdmin) {
      return {};
    }

    return { "create_by.id": aUser.id };
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
