'use strict';

var log = log_from('power'),
  innerPowersCache = LRU({
    max: 20,
    maxAge: 1000 * 60 * 60 * 5
  });

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
    name: 'PUBLIC_LIST',
    desc: 'List Public Resource'
  },
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

power.hasInnerPower = function (powerKey, resultCall, usr) {
  if (usr.isAdmin) {
    return resultCall(true);
  }

  power.getInnerPowers(function (innerAns) {
    var ans = ansWrap(innerAns);
    if (ans.isFail()) {
      log.warn(ans.message, 'hasInnerPower');
      return resultCall(false);
    }

    var checkPower = null;
    _.each(ans.get(), function (innerPower) {
      if (powerKey === innerPower.name) {
        checkPower = innerPower;
        return false;
      }
    });

    if (null == checkPower) {
      return resultCall(false);
    }

    if ((usr.innerPowers || []).indexOf(checkPower.id) == -1) {
      return resultCall(false);
    }

    return resultCall(true);
  });
};

power.getInnerPowers = function (resultCall) {
  var key = 'INNER_POWERS', cacheResource = innerPowersCache.get(key);
  if (cacheResource) {
    return resultCall(answer.succ(cacheResource));
  } else {
    power.find({type: 3}).toArray(function (err, items) {
      if (err) {
        return resultCall(answer.fail(err.message));
      }

      items = items || [];
      innerPowersCache.set(key, items);
      return resultCall(answer.succ(items));
    });
  }
};

power.createInnerPowers = function (requestInfo) {
  if (requestInfo.usr.isAdmin) {
    innerPowersCache.reset();
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
              } else if (1 != result.insertedCount && !History.isObjectID(result.insertedId)) {
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

