'use strict';

var model = schema({
  id: { type: 'integer', required: true },
  title: { type: 'string', required: true, allowEmpty: false },
  summary: { type: 'string', allowEmpty: false },
  content: { type: 'string', allowEmpty: false },
  note: { type: 'string' },
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

var note = model_bind('note', model);

module.exports = note;

