'use strict';

var log = log_from('power');

var model = schema({
  id: { type: 'integer', required: true },
  type: { type: 'integer', enum: [1, 2], required: true, const: { 1: 'Resource', 2: 'Manual API'} },
  name: { type: 'string', required: true, allowEmpty: false },
  desc: { type: 'string', allowEmpty: false },
  resources: { type: 'array', uniqueItems: true },
  env: { type: 'array', uniqueItems: true },
  group: { type: 'array', uniqueItems: true },
  server: {
    type: 'object',
    properties: {
      scope: { type: 'integer', enum: [1, 2, 3, 4], required: true, const: SCOPE_DEFINE },
      define: { type: 'array', uniqueItems: true }
    }
  },
  interface: {
    type: 'object',
    properties: {
      scope: { type: 'integer', enum: [1, 2, 3, 4], required: true, const: SCOPE_DEFINE },
      define: { type: 'array', uniqueItems: true }
    }
  },
  create_time: { type: 'date', required: true }
});

var power = model_bind('power', model);

var innerPowers = [
  {
    name: 'PUBLIC_RETRIEVE',
    desc: 'Retrieve Public Resource'
  },
  {
    name: 'PUBLIC_UPDATE',
    desc: 'Update Public Resource'
  },
  {
    name: 'PUBLIC_DELETE',
    desc: 'Delete Public Resource'
  }
];

power.createInnerPowers = function (requestInfo) {
  if (requestInfo.usr.isAdmin) {
    _.each(innerPowers, function (inner) {
      power.find({
        name: inner.name,
        type: 3
      }).limit(1).next(function(err, exists){
        if (err) {
          log.error(inner.name + ': ' + err.message);
        } else if (!exists) {
          power.nextId(function (id) {
            power.insertOne({
              id: id,
              type: 3,
              name: inner.name,
              desc: inner.desc,
              create_time: new Date(),
              last_modify_time: new Date()
            }, function(errinsert, result) {
              if (errinsert) {
                log.error(inner.name + ': ' + errinsert.message);
              } else if (1 != result.insertedCount) {
                log.error(inner.name + ': Create fail');
              }
            });
          });
        }
      });
    });
  }
};

module.exports = power;

