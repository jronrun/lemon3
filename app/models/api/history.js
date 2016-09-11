'use strict';

var model = schema({
  id: { type: 'integer', required: true },
  env: { type: 'object' },
  group: { type: 'object' },
  serv: { type: 'object' },
  api: { type: 'object' },
  note: { type: 'string' },
  user: {
    type: 'object',
    properties: {
      id: { type: 'string', allowEmpty: false },
      name: { type: 'string', required: true },
      ip: { type: 'string', allowEmpty: false }
    }
  },
  create_time: { type: 'date', required: true }
});

var history = model_bind('history', model);

module.exports = history;

