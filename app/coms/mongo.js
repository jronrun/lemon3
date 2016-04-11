'use strict';

var mongo = require('mongoskin');
var config = require('../../config/config');

//http://stackoverflow.com/questions/30389319/mongoskin-and-connection-issue-to-mongodb-replica-cluster
//'mongodb://username:password@177.77.66.9:27017,88.052.72.91:27017/dbname?replicaSet=yourReplicaCluster';

var db = mongo.db(config.db, {
  w: 0,
  native_parser: (process.env['TEST_NATIVE'] != null),
  auto_reconnect: true,
  poolSize: 100,
  socketOptions: {
    keepAlive: 50,
    connectTimeoutMS: 1000,
    socketTimeoutMS: 0
  }
});

db.bind('counter').bind({

  nextSequence: function(sequenceName) {
    var deferred = when.defer();
    db.collection('counter').findOneAndUpdate(
      {_id: sequenceName},
      {$inc: {seq: 1}},
      {upsert: true, returnOriginal: false},
      function (err, doc) {
        if (err) {
          deferred.reject(err);
        } else {
          deferred.resolve(doc.value.seq);
        }
      }
    );

    return deferred.promise;
  }
});

module.exports.db = db;
module.exports.Base = function(model, modelName, define) {
  return {

    desc: function(exclude, compress) {
      exclude = exclude || [];
      exclude.push('create_time');
      exclude.push('id');
      var target = _.cloneDeep(define.schema.properties);
      _.each(exclude, function (prop) {
        delete target[prop];
      });

      target = JSON.stringify(target);
      return compress ? crypto.compress(target) : target;
    },

    validate: function(target) {
      var errMsg = modelName + ' model schema is undefined';
      if (_.isFunction(define)) {
        var ret = define(target);
        if (ret.valid) {
          return { valid: true };
        }

        var errs = []; _.each(ret.errors, function(err) {
          errs.push(err.property + ' ' + err.message);
        });
        errMsg = errs.join(', ');
      }

      return {
        valid: false,
        msg: errMsg
      }
    },

    nextId: function(callback) {
      var promise = db.counter.nextSequence(modelName);
      if (_.isFunction(callback)) {
        promise.then(function (id) {
          callback(id);
        });
      }

      return promise;
    }

  }
};
