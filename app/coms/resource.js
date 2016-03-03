var defined = require('../../config/source'),
  JSONSchemaValidator = require('ajv'),
  log = log_from('resource');

var resource = {}, uniqueIds = [], uniqueActions = [], models = {},
  ajv = JSONSchemaValidator({allErrors: true}),
  validate = ajv.compile(defined.schema);

var asModel = function(item) {
  var source = _.extend({
    do: '/',
    base: '',
    baseId: item.baseId || item.id,

    pid: 0,
    action: '/',
    type: defined.type.URL,
    method: defined.method.GET
  }, item || {});

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
  var children = item.children || [];
  delete item.children;
  item.action = _.startsIf(item.action || '/', '/');
  item.action = item.action.length > 1 ? _.trimEnd(item.action, '/') : item.action;
  var model = asModel(item);

  if (uniqueIds.indexOf(model.id) != -1) {
    log.error(new Error('Duplation Resource ID'), model);
  }

  if (uniqueActions.indexOf(model.action + '_' + model.method) != -1) {
    log.error(new Error('Duplation Resource Action and Method'), model);
  }

  parent[model.name] = model;
  models[model.id] = _.clone(model);
  uniqueIds.push(model.id);
  uniqueActions.push(model.action + '_' + model.method);

  _.each(children, function (child) {
    child.action = _.startsIf(child.action || '/', '/');
    child.action = (_.endsIf(model.action, '/') + child.action).replace(/\/\//g, '/');
    child.pid = model.id;
    child.base = model.base || model.action;
    child.baseId = model.baseId || model.id;
    analyst(child, model);
  });
};

_.each(defined.items, function (item) {
  analyst(item, resource);
});

/**
 * Get defined resource with given ID or action with method, method default is Method.GET
 * @param arg   ID or Action
 * @param method
 * @returns {*}
 */
var getResource = function(arg, method) {
  var matched = {};
  if (_.isInteger(arg)) {
    matched = models[arg];
  }

  else if (_.isString(arg)) {
    var action = _.startsIf(arg, '/');
    action = action.length > 1 ? _.trimEnd(action, '/') : action;
    method = method || defined.method.GET;

    var items = _.values(models);
    for (var idx = 0; idx < items.length; idx++) {
      var curModel = items[idx];
      if (curModel.action == action && curModel.method == method) {
        matched = curModel;
        break;
      }
    }
  }

  return _.clone(matched);
};

uniqueIds = null; uniqueActions = null;
module.exports.getResource = getResource;
module.exports.resource = resource;
