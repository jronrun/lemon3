'use strict';

var log = log_from('power');

// Exclude > Include if contain both in same time
var sourceDefineConst = {
  1: 'Include All',
  2: 'Include only in Define',
  3: 'Exclude All',
  4: 'Exclude only in Define'
};

var model = schema({
  id: { type: 'integer', required: true },
  type: { type: 'integer', enum: [1, 2], required: true, const: { 1: 'Resource', 2: 'Manual API'} },
  name: { type: 'string', required: true, allowEmpty: false },
  desc: { type: 'string', allowEmpty: false },
  resources: { type: 'array', uniqueItems: true },
  env: { type: 'array', uniqueItems: true },
  group: { type: 'array', uniqueItems: true },
  server: {
    type: 'object',
    properties: {
      scope: { type: 'integer', enum: [1, 2, 3, 4], required: true, const: sourceDefineConst },
      define: { type: 'array', uniqueItems: true }
    }
  },
  interface: {
    type: 'object',
    properties: {
      scope: { type: 'integer', enum: [1, 2, 3, 4], required: true, const: sourceDefineConst },
      define: { type: 'array', uniqueItems: true }
    }
  },
  create_time: { type: 'date', required: true }
});

var power = model_bind('power', model);

module.exports = power;

