'use strict';

var model = schema({
  id: { type: 'integer', required: true },
  share: { type: 'string', allowEmpty: false, required: true },
  share_id: { type: 'integer', required: true },
  share_read_write: { type: 'integer', enum: [1, 2, 3, 4], required: true, const: {
      1: 'Readonly',
      2: 'User Power',
      3: 'Executable',
      4: 'Unknown'
    }
  },
  history: { type: 'integer' },
  fail: {type: 'string' },
  type: { type: 'integer', enum: [1, 2, 3, 4], required: true, const: {
      1: 'Opened',
      2: 'Executed',
      3: 'Try Open',
      4: 'Try Execute'
    }
  },
  create_by: {
    type: 'object',
    properties: {
      id: { type: 'string', allowEmpty: false },
      name: { type: 'string', required: true },
      ip: { type: 'string', allowEmpty: false }
    }
  },
  last_modify_time: { type: 'date', required: true },
  create_time: { type: 'date', required: true }
});

var shareAccess = model_bind('share_access', model);

shareAccess.add = function(access, resultCall, requestInfo) {
  async.waterfall([
    function(callback) {
      var target = _.extend({
        type: 1,
        create_by: {
          id: requestInfo.anonymous ? '-1' : requestInfo.usr.id,
          name: requestInfo.anonymous ? 'anonymous' : requestInfo.usr.name,
          ip: requestInfo.clientIP
        },
        fail: '',
        last_modify_time: new Date(),
        create_time: new Date()
      }, access || {});

      if (2 == target.type && !target.history) {
        return resultCall(answer.fail('execute access must provide history id'));
      }

      if ([3, 4].indexOf(target.type) != -1 && !target.fail) {
        return resultCall(answer.fail('try access must provide fail message'));
      }

      callback(null, target);
    },

    function(target, callback) {
      shareAccess.nextId(function (id) {
        target.id = id;

        var check = shareAccess.validate(target);
        if (!check.valid) {
          return resultCall(answer.fail(check.msg));
        }

        shareAccess.insertOne(target, function(err, result) {
          if (err) {
            return resultCall(answer.fail(err.message));
          }

          if (1 != result.insertedCount) {
            return resultCall(answer.fail('create fail'));
          }

          target._id = result.insertedId.toString();
          callback(null, target);
        });
      });
    }
  ], function(err, result) {
    resultCall(answer.succ(result));
  });
};

module.exports = shareAccess;

