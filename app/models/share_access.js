'use strict';

var Share = app_require('models/share');

var model = schema({
  id: { type: 'integer', required: true },
  share: { type: 'string', allowEmpty: false, required: true },
  share_id: { type: 'integer', required: true },
  share_user_id: { type: 'string', allowEmpty: false, required: true },
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

      if (!shareAccess.isObjectID(target.share)) {
        return resultCall(answer.fail('invalid access share id ' + target.share));
      }

      callback(null, target);
    },

    function(target, callback) {
      Share.findById(target.share, function (err, aShare) {
        if (err) {
          return resultCall(answer.fail(err.message));
        }

        if (!aShare) {
          return resultCall(answer.fail('can not find access share.'));
        }

        _.extend(target, {
          share_id: aShare.id,
          share_read_write: aShare.read_write,
          share_user_id: aShare.create_by.id
        });

        callback(null, target);
      });
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

          if (1 != result.insertedCount && !shareAccess.isObjectID(result.insertedId)) {
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

