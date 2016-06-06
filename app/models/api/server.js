'use strict';

var log = log_from('server');

var model = schema({
  id: { type: 'integer', required: true },
  env_id: { type: 'integer', required: true },
  group_id: { type: 'integer', required: true },
  name: { type: 'string', required: true, allowEmpty: false },
  desc: { type: 'string', allowEmpty: false },
  owner: { type: 'integer', enum: [0, 1], required: true, const: { 0: 'Public', 1: 'Private'} },
  request: {
    type: 'object',
    properties: {
      type: { type: 'integer', enum: [1, 2], required: true, const: { 1: 'Single interface', 2: 'Multi-interface'} },
      //Parameter name when request, need if multi_interface is true
      param_name: { type: 'string', allowEmpty: false, description: 'Parameter name when request, need if Multi-interface' },
      //Interface name property in request data
      interf_prop: { type: 'string', allowEmpty: false, description: 'Interface name property' },
      //Add to request data every time
      add_params: { type: 'object' }
    }
  },
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

var server = model_bind('server', model);

module.exports = server;

