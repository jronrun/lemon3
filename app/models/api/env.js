'use strict';

var model = schema({
  id: { type: 'integer', required: true },
  name: { type: 'string', required: true, allowEmpty: false },
  desc: { type: 'string' },
  order: { type: 'integer', required: true, description: 'Ascending sort by number value' },
  alert_level: { type: 'string', enum: ['default', 'info', 'success', 'primary', 'warning', 'danger'], required: true },
  owner: { type: 'integer', enum: [1, 2], required: true, const: { 1: 'Public', 2: 'Private'} },
  create_by: {
    type: 'object',
    required: true,
    properties: {
      id: { type: 'string', required: true },
      name: { type: 'string', required: true }
    }
  },
  last_modify_time: { type: 'date', required: true },
  create_time: { type: 'date', required: true }
});

var env = model_bind('env', model);

module.exports = env;

