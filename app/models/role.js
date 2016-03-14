'use strict';

var log = log_from('role');

var model = schema({
  id: { type: 'integer', required: true },
  name: { type: 'string', required: true, allowEmpty: false },
  desc: { type: 'string', allowEmpty: false },
  powers: { type: 'array', uniqueItems: true },
  resources: { type: 'array', uniqueItems: true, dependencies: 'powers' },
  create_time: { type: 'date', required: true }
});


var role = model_bind('role', {

}, model);


module.exports = role;

