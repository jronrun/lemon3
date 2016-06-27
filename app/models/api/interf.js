'use strict';

var log = log_from('interf');

var model = schema({
  id: { type: 'integer', required: true },
  group_id: { type: 'integer', required: true },
  name: { type: 'string', required: true, allowEmpty: false },
  desc: { type: 'string' },
  request: { type: 'object', required: true, allowEmpty: false},
  response: { type: 'object' },
  request_doc: { type: 'string', required: true, allowEmpty: false },
  response_doc: { type: 'string' },
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

var interf = model_bind('interf', model);

module.exports = interf;

