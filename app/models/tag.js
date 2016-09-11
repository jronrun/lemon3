'use strict';

var log = log_from('tag');

var model = schema({
  id: { type: 'integer', required: true },
  name: { type: 'string', required: true, allowEmpty: false },
  desc: { type: 'string' },
  type: { type: 'integer', enum: [1, 2, 3], required: true, const: {
      1: 'API',
      2: 'History',
      3: 'Note'
    }
  },
  color: { type: 'string', required: true },
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

var tag = model_bind('tag', model);

module.exports = tag;

