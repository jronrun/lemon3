'use strict';

var log = log_from('history');

var model = schema({
  id: { type: 'integer', required: true },
  env: { type: 'object' },
  group: { type: 'object' },
  serv: { type: 'object' },
  api: { type: 'object' },
  interf: { type: 'object' },
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

