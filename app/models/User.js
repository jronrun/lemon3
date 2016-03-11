'use strict';

var log = log_from('user');

var model = schema({
  name: { type: 'string', required: true, allowEmpty: false },
  email: { type: 'string', format: 'email', allowEmpty: false },
  passwd: { type: 'string', required: true, allowEmpty: false },
  roles: { type: 'array', uniqueItems: true },
  state: { type: 'integer', enum: [
    0,  // 正常
    1,  // 冻结
    9   // 删除
  ], required: true },
  create_time: { type: 'date', required: true }
});

var user = model_bind('user', {

});


module.exports = user;

