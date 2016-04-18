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

var pages = {
  /**
   * [{
   * "text": "",   //text
   * "current": 1, //current page
   * "num": 1      //page no, 0 if none page
   * }]
   */
  index: function (num, text, current) {
    var ret = {text: text || (num + ''), num: num};
    if (current) {
      ret.current = current;
    }
    return ret;
  },

  wrap: function (pagination) {
    var critical = 6, start = 0, end = 0, index = [],
      pageCount = parseInt(pagination.pages), currentPage = parseInt(pagination.page);
    if (currentPage < critical) {
      start = 1;
      end = critical;
    } else {
      start = currentPage - 2;
      end = currentPage + 2;
    }

    if (end > pageCount) {
      end = pageCount;
    }

    if (currentPage > 1) {
      index.push(pages.index(currentPage - 1, 'Prev'));
    }

    if (start > 1) {
      index.push(pages.index(1));
      index.push(pages.index(0, '...'));
    }

    for (var idx = start; idx <= end; idx++) {
      if (idx == currentPage) {
        index.push(pages.index(idx, idx + '', idx));
      } else {
        index.push(pages.index(idx));
      }
    }

    if (end < pageCount) {
      if (end != pageCount - 1) {
        index.push(pages.index(0, '...'));
      }
      index.push(pages.index(pageCount));
    }

    if (currentPage < pageCount) {
      index.push(pages.index(parseInt(currentPage) + 1, 'Next'));
    }

    pagination.index = index;
    return pagination;
  }
};

module.exports.db = db;
module.exports.Base = function(model, modelName, define) {
  var core = {

    /**
     * Page Query
     * @param query
     * @param page      Page no
     * @param callback
     * @param size      Page size
     * @param options
     * {
     *  field: '',      //sort field name
     *  sort: 1         //sort 1 asc, -1 desc
     * }
     *
     * @returns {Promise}
     * {
     *  items: [],
     *  page: {
     *    page: 3,      //current page
     *    size: 2,      //page size
     *    lastId: 3,    //current page max id
     *    count: 7,     //total count
     *    pages: 4,     //total page
     *    maxId: 10     //current collection max id
     *   }
     * }
       */
    page: function(query, page, callback, size, options) {
      var deferred = when.defer();
      page = page || 1; size = size || 30; options = _.extend({
        field: 'id',
        sort: -1
      }, options || {});

      core.lastId(function (maxId) {
        var originalQry = _.cloneDeep(query || {}), pageLastId = null;
        if (-1 == options.sort) {
          pageLastId = 1 == page ? maxId : (maxId - (page - 1) * size);
        } else {
          pageLastId = (page - 1) * size + 1;
        }

        core.findPage(pageLastId, size, query, options).toArray(function (err, items) {
          if (err) {
            deferred.reject(err);
          } else {
            var pagination = {
              page: page,
              size: size,
              lastId: pageLastId,
              maxId: maxId
            };

            model.count(originalQry, function(err, count) {
              if (err) {
                deferred.reject(err);
              } else {
                pagination.count = count;
                var totalPage = Math.floor(count / size);
                if (count % size > 0) {
                  ++totalPage;
                }
                pagination.pages = totalPage;

                deferred.resolve({
                  items: items,
                  page: pages.wrap(pagination)
                });
              }
            });

          }
        });
      });

      if (_.isFunction(callback)) {
        deferred.promise.then(function (result) {
          callback(result);
        });
      }

      return deferred.promise;
    },

    /**
     * Page Find
     * @param lastId
     * @param pageSize
     * @param query
     * @param options
     * {
     *  field: '',      //sort field name
     *  sort: 1         //sort 1 asc, -1 desc
     * }
     * @returns {*}
     */
    findPage: function(lastId, pageSize, query, options) {
      options = _.extend({
        field: 'id',
        sort: -1
      }, options || {});

      var condition = {}, aSort = {};
      if (-1 == options.sort) {
        condition[options.field] = { $lte : lastId };   //{id : { $lte : lastId }}
      } else {
        condition[options.field] = { $gte : lastId };   //{id : { $gte : lastId }}
      }
      aSort[options.field] = options.sort;            //{id : -1}

      return model.find(_.extend(query || {}, condition)).sort(aSort).limit(pageSize);
    },

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

    lastId: function(callback) {
      var deferred = when.defer();
      db.collection('counter').find({_id: modelName}).limit(1).next(function(err, doc){
        if (err) {
          deferred.reject(err);
        } else {
          deferred.resolve(doc.seq);
        }
      });

      if (_.isFunction(callback)) {
        deferred.promise.then(function (lastId) {
          callback(lastId);
        });
      }

      return deferred.promise;
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

  };

  return core;
};
