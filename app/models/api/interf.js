'use strict';

var log = log_from('interf');

var model = schema({
  id: { type: 'integer', required: true },
  group_id: { type: 'integer', required: true },
  name: { type: 'string', required: true, allowEmpty: false },
  desc: { type: 'string', allowEmpty: false },
  request: { type: 'object' },
  response: { type: 'object' },
  owner: { type: 'integer', enum: [1, 2], required: true, const: { 1: 'Public', 2: 'Private'} },
  create_by: {
    type: 'object',
    required: true,
    properties: {
      user_id: { type: 'string', required: true },
      user_name: { type: 'string', required: true }
    }
  },
  last_modify_time: { type: 'date', required: true },
  create_time: { type: 'date', required: true }
});

var interf = model_bind('interf', model);

module.exports = interf;

