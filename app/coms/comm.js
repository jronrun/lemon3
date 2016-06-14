'use strict';

var path = require('path'),
  logger = require('./log'),
  mongo = require('./mongo'),
  crypto = require('./crypto'),
  _ = require('lodash'),
  when = require('when'),
  async = require('async'),
  revalidator = require('revalidator'),
  json5s = require('../../public/js/json5s'),
  json5update = require('jju/lib/document').update,
  moment = require('moment'),
  LRU = require("lru-cache"),
  format = require('util').format
  ;

var CONSTANT = {
  ADMIN_ROLE: 0,
  DEFAULT_PAGESIZE: 30
};

var answer = {
  fail: function(msg, result, code) {
    return {
      code: code || -1,
      result: result || {},
      msg: msg || ''
    }
  },
  succ: function(result, msg) {
    return {
      code: 0,
      result: result || {},
      msg: msg || ''
    }
  }
};

var extend_lodash = {
  startsIf: function (target, start) {
    return _.startsWith(target, start) ? target : (start + target);
  },

  endsIf: function (target, end) {
    return _.endsWith(target, end) ? target : (target + end);
  },

  aroundWith: function (target, around) {
    return _.startsWith(target, around) && _.endsWith(target, around);
  },

  aroundIf: function (target, around) {
    return _.endsIf(_.startsIf(target, around), around);
  },

  afterOccur: function(target, delimiter, position) {
    var tokens = target.split(delimiter).slice(position || 1);
    return delimiter + tokens.join(delimiter);
  },

  beforeOccur: function(target, delimiter, position) {
    return target.replace(extend_lodash.afterOccur(target, delimiter, position), '');
  }
};

function checkNode(tree, source) {
  _.each(tree, function (node) {
    if (source.indexOf(node.id) != -1) {
      node.check = 1;
    }
    if (node.nodes) {
      checkNode(node.nodes, source);
    }
  });
}

function checkMenu(menus, source, target) {
  _.each(menus, function (menu) {
    if (1 == menu.type) {
      var child = [];
      checkMenu(menu.children, source, child);
      if (child.length > 0) {
        menu.children = child;
        target.push(menu);
      }
    } else if (2 == menu.type) {
      if (source.indexOf(menu.id) != -1) {
        target.push(menu);
      }
    }
  });
}

function reverseObj(target, theRef, path) {
  _.each(target, function (v, k) {
    if (_.isArray(v)) {
      _.each(v, function (item, idx) {
        reverseObj(item, theRef, k + '[' + idx + ']');
      });
    } else if (_.isObject(v)) {
      reverseObj(v, theRef, k);
    } else {
      theRef['' == path ? k : (path + '.' + k)] = v;
    }
  });
}

module.exports = function(scope, config) {

  scope._ = _;
  _.extend(_, extend_lodash);
  _.extend(scope, CONSTANT);

  scope.moment = moment;
  scope.answer = answer;
  scope.json5s = json5s;
  scope.json5update = json5update;
  scope.crypto = crypto;
  scope.when = when;
  scope.async = async;
  scope.format = format;
  scope.LRU = LRU;
  scope.userReourceCache = LRU({
    max: 100,
    maxAge: 1000 * 60 * 5
  });
  scope.userReourceCacheReset = function() {
    userReourceCache.reset();
  };
  scope.isAdminUser = function(user) {
    return (user.roles || []).indexOf(ADMIN_ROLE) != -1;
  };
  scope.schema = function(target) {
    target = target.properties ? target : {
      type: 'object',
      properties: target
    };

    var aModel = function(object) {
      return revalidator.validate(object, target);
    };

    aModel.schema = target;
    return aModel;
  };

  scope.actionWrap = function(action, args) {
    var ret = {}, args = _.isArray(args) ? args : [args];
    if (action.indexOf(':') != -1) {
      ret.base = _.beforeOccur(action, ':');
      action = ret.base + (args || []).join('/');
    }
    ret.action = action;
    return ret;
  };
  scope.getAction = function(resource, args) {
    return actionWrap(resource.action, args).action;
  };

  scope.app_require = function(moduleName) {
    return require(path.join(config.root, path.sep, 'app', path.sep, moduleName));
  };

  scope.log_from = function(options) {
    return logger(options);
  };

  scope.database = function() {
    return mongo.db;
  };

  scope.model_bind = function(modelName, modelSchema, methods) {
    var model = database().bind(modelName);
    model.bind(_.extend(mongo.Base(model, modelName, modelSchema), methods || {}));
    model.define = modelSchema;
    model.modelName = modelName;
    return model;
  };

  scope.datefmt = function(targetDate, dateStyle) {
    var mo = targetDate ? moment(targetDate) : moment();
    return mo.format(dateStyle || 'YYYY-MM-DD HH:mm:ss');
  };

  /**
   * Data convert {"a.b.c": 3} -> {a: {b: {c: 3}}}
   */
  scope.convertData = function(target) {
    var afterTrans = {};
    _.each(target, function (v, k) {
      _.set(afterTrans, k, v);
    });
    return afterTrans;
  };

  /**
   * Data reverse {a: {b: {c: 3}}} -> {"a.b.c": 3}
   */
  scope.reverseData = function(target) {
    var afterTrans = {};
    reverseObj(target, afterTrans, '');
    return afterTrans;
  };

  var resource = require('./resource');
  scope.getResource = resource.getResource;
  scope.routes = resource.resource;
  scope.HttpMethod = resource.methods;
  scope.getUserMenu = function(source, isAdmin) {
    if (isAdmin) {
      return resource.menus;
    }

    var menus = [];
    checkMenu(_.cloneDeep(resource.menus), source, menus);
    return menus;
  };
  scope.getResourceTree = function(source) {
    var checkSource = [];
    _.each(source || [], function (v) {
      checkSource.push(_.isNumber(v) ? v : parseInt(v));
    });
    var tree = _.cloneDeep(resource.tree);
    checkNode(tree, checkSource);
    return tree;
  };

};
