'use strict';

var log = log_from('share');

var model = schema({
  id: { type: 'integer', required: true },
  //Allow open count, Unlimited if count is 0
  total_count: { type: 'integer', required: true },
  remain_count: { type: 'integer', required: true },
  start_time: { type: 'date', required: true },
  //share expire time
  end_time: { type: 'date', required: true },
  share_scope: {
    type: 'object',
    properties: {
      anonymous: { type: 'integer', enum: [1, 2], required: true, const: { 1: 'Anonymous', 2: 'Login User'} },
      scope: { type: 'integer', enum: [1, 2, 3, 4], required: true, const: SCOPE_DEFINE },
      define: { type: 'array', uniqueItems: true }
    }
  },
  state: { type: 'integer', enum: [1, 2], required: true, const: { 0: 'Normal', 2: 'Canceled'} },
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

var share = model_bind('share', model);

module.exports = share;

