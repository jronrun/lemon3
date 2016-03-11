'use strict';

var log = log_from('article');

module.exports.model = schema({
  name: { type: 'string', required: true, allowEmpty: false },
  summary: { type: 'string', allowEmpty: false },
  content: { type: 'string', required: true, allowEmpty: false },
  create_time: { type: 'date', required: true }
});

var note = model_bind('note', {

});


module.exports = note;

