'use strict';

var log = log_from('env');

var model = schema({
  id: { type: 'integer', required: true },
  name: { type: 'string', required: true, allowEmpty: false },
  desc: { type: 'string', allowEmpty: false },
  owner: { type: 'integer', enum: [0, 1], required: true, const: { 0: 'Public', 1: 'Private'} },
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

var env = model_bind('env', model);

module.exports = env;
