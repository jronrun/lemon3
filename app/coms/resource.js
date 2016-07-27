'use strict';

var defined = require('../../config/source'),
  JSONSchemaValidator = require('ajv'),
  log = log_from('resource');

var resource = {}, uniqueIds = [], uniqueActions = [],
  models = {}, extend = [], tree = [], menus = [],
  ajv = JSONSchemaValidator({allErrors: true}),
  validate = ajv.compile(defined.schema);

var asModel = function(item) {
  var source = _.extend({
    do: '/',
    base: '',
    baseId: item.baseId || item.id,

    pid: 0,
    action: '/',
    type: defined.type.page,
    method: defined.method.GET,
    protect: true
  }, item || {});

  if (defined.type.page == source.type && !source.page) {
    if (source.pid > 0) {
      source.page = _.trimStart(source.action, '/');
    } else if (source.pid == 0) {
      source.page = source.name + '/index';
    }
  }

  var valid = validate(source);
  if (!valid) {
    log.error('Error Resource: ', source, validate.errors);
  }

  if (source.pid > 0) {
    source.do = source.action.replace(source.base, '');
  }

  return source;
};

var analyst = function(item, parent) {
  if (item.extend) {
    if (!item.id || !item.method) {
      log.error(Error('Invalid Extend Resource, base properties: id, extend, method'), item);
    } else {
      extend.push(item);
    }
    return;
  }

  var children = item.children || [];
  delete item.children;
  item.action = item.action || item.name;
  item.action = _.startsIf(item.action || '/', '/');
  item.action = item.action.length > 1 ? _.trimEnd(item.action, '/') : item.action;
  var model = asModel(item);

  if (uniqueIds.indexOf(model.id) != -1) {
    log.error(Error('Duplation Resource ID'), model);
  }

  if (uniqueActions.indexOf(model.action + '_' + model.method) != -1) {
    log.error(Error('Duplation Resource Action and Method'), model);
  }

  parent[model.name] = model;
  models[model.id] = _.clone(model);
  uniqueIds.push(model.id);
  uniqueActions.push(model.action + '_' + model.method);

  _.each(children, function (child) {
    if (!child.extend) {
      if (!child.action) {
        child.action = child.action || child.name;
        child.action = _.startsIf(child.action || '/', '/');
        child.action = (_.endsIf(model.action, '/') + child.action).replace(/\/\//g, '/');
      }

      child.pid = model.id;
      child.base = model.base || model.action;
      child.baseId = model.baseId || model.id;
    }
    analyst(child, model);
  });
};

_.each(_.cloneDeep(defined.items), function (item) { analyst(item, resource); });

/**
 * Get defined resource with given ID or action with method, method default is Method.GET
 * @param arg   ID or Action
 * @param method
 * @returns {*}
 */
var getResource = function(arg, method) {
  var matched = null;
  if (_.isInteger(arg)) {
    matched = models[arg];
  }

  else if (_.isString(arg)) {
    var action = _.startsIf(arg, '/');
    action = action.length > 1 ? _.trimEnd(action, '/') : action;
    method = method || defined.method.GET;

    matched = _.values(models).find(function(curModel) {
      if (curModel.method == method) {
        var act = curModel.action;
        if (act.indexOf(':') != -1) {
          if (!_.startsWith(action, _.beforeOccur(act, ':', 1))) {
            return false;
          }

          var actLen = act.replace(/:/g, '').split('/').length - 1,
              actionLen = action.split('/').length - 1;

          return actLen == actionLen;
        }

        return act == action;
      }

      return false;
    });
  }

  return _.clone(matched || {});
};

_.each(extend, function (item) {
  var base = getResource(item.extend);
  if (_.isMatch({}, base)) {
    log.error(Error('Cannot Find Extend Resource'), item);
  } else {
    models[item.id] = _.extend(base, item);
  }
});

// { name: '', type: '1 node, 2 menu', action: '', sourceId: '', children: [], args: [] }

var fillmenu = function (item, parent) {
  var obj = {};

  if (item.sourceId) {
    var src = getResource(item.sourceId);
    obj.name = item.name || src.desc;
    obj.action = src.action;
    obj.type = 2;
    obj.id = item.sourceId;

    //if (src.action.indexOf(':') != -1) {
    //  obj.action = _.beforeOccur(src.action, ':', 1) + (item.args || []).join('/');
    //}
    obj.action = actionWrap(src.action, item.args).action;
  } else {
    obj.type = 1;
    obj.name = item.name;
    obj.children = [];
  }

  _.each(item.children || [], function (child) {
    fillmenu(child, obj.children);
  });

  parent.push(obj);
};

_.each(defined.menu, function (item) { fillmenu(item, menus); });

var buildtree = function(item, parent) {
  var raw = getResource(item.id);
  var nod = {
    id: item.id,
    text: raw.desc
  };

  var children = item.children || [];
  if (children.length > 0) {
    nod.nodes = [];
    _.each(children, function (child) {
      buildtree(child, nod.nodes);
    });

    nod.tags = [ String(nod.nodes.length) ];
  }

  if (false != raw.protect) {
    parent.push(nod);
  }
};

_.each(defined.items, function (item) { buildtree(item, tree); });

//log.info(JSON.stringify({items: tree}));
//log.info(JSON.stringify(resource));
//log.info(models);

uniqueIds = null; uniqueActions = null;
module.exports = {
  getResource: getResource,
  resource: resource,
  menus: menus,
  tree: tree,
  methods: defined.method
};
