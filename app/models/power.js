'use strict';

var log = log_from('power');

var model = schema({
  id: { type: 'integer', required: true },
  name: { type: 'string', required: true, allowEmpty: false },
  desc: { type: 'string', allowEmpty: false },
  resources: { type: 'array', uniqueItems: true },
  create_time: { type: 'date', required: true }
});

var power = model_bind('power', {

}, model);

module.exports = power;

