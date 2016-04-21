'use strict';

var mongodb = require('mongodb');
var ObjectID = mongodb.ObjectID;
var mongoskin = require('mongoskin');
var config = require('../../config/config');

//http://stackoverflow.com/questions/30389319/mongoskin-and-connection-issue-to-mongodb-replica-cluster
//'mongodb://username:password@177.77.66.9:27017,88.052.72.91:27017/dbname?replicaSet=yourReplicaCluster';

var db = mongoskin.db(config.db, {
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
  intl_id: '62959dc68c252b4865db4i8f',
  default_size: 30,
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
      index.push(pages.index(Math.min(currentPage - 1, pageCount), 'Prev'));
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
  },

  wrapRange: function (pagination) {
    var index = [];
    index.push(pages.index('za' + pagination.headId, 'Prev'));
    index.push(pages.index(0, pagination.size + ' of ' + pagination.count));
    index.push(pages.index('az' + pagination.tailId, 'Next'));
    pagination.index = index;
    return pagination;
  }
};

module.exports.db = db;
module.exports.Base = function(model, modelName, define) {
  var core = {

    toObjectID: function (hex) {
      if (hex instanceof ObjectID) {
        return hex;
      }
      if (!hex || hex.length !== 24) {
        return hex;
      }
      return ObjectID.createFromHexString(hex);
    },

    isObjectID: function (idstr) {
      return ObjectID.isValid(idstr);
    },

    /**
     * Page Query with skip, use small collection
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
     *    count: 7,     //total count
     *    pages: 4      //total page
     *   }
     * }
     */
    pageWithSkip: function(query, page, callback, size, options) {
      var deferred = when.defer();
      page = page || 1; size = size || pages.default_size; options = _.extend({
        field: '_id',
        sort: -1
      }, options || {});

      var aSort = {}, originalQry = _.extend(query || {});
      aSort[options.field] = options.sort;
      model.find(originalQry).sort(aSort).skip((page - 1) * size).limit(size).toArray(function (err, items) {
        if (err) {
          deferred.reject(err);
        } else {
          var pagination = {
            page: page,
            size: size
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

      if (_.isFunction(callback)) {
        deferred.promise.then(function (result) {
          callback(result);
        });
      }

      return deferred.promise;
    },

    /**
     * Page Query with range query
     * @param query
     * @param param      critical id,
     *    1. page no
     *    2. Next: az + pages.intl_id, Prev: za + pages.intl_id
     *       az62959dc68c252b4865db4i8f,  za62959dc68c252b4865db4i8f
     * @param callback
     * @param size            Page size
     * @param options
     * {
     *  order: 1,       //page order, 1 next page, -1 prev page
     *  field: '',      //sort field name
     *  sort: 1,        //sort 1 asc, -1 desc,
     *  format: function(fieldVal){}    //format param field value
     * }
     */
    page: function(query, param, callback, size, options) {
      if (/^[1-9]\d{0,5}$/.test(param)) {
        return core.pageWithSkip(query, parseInt(param), callback, size, options);
      } else {
        var order = param.substr(0,2), criticalId = param.substr(2), aSort = {};
        options = _.extend({
          field: '_id',
          sort: -1,
          order: 'za' == order ? -1 : 1
        }, options || {});

        if (criticalId == pages.intl_id) {
          var deferred = when.defer();
          aSort[options.field] = options.sort;
          model.find(query).sort(aSort).limit(1).toArray(function (err, items) {
            if (err) {
              deferred.reject(err);
            }
            criticalId = (items || []).length > 0 ? (items[0][options.field]) : 0;
            core.pageWithRange(query, criticalId, function(result) {
              deferred.resolve(result);
            }, size, options);
          });

          if (_.isFunction(callback)) {
            deferred.promise.then(function (result) {
              callback(result);
            });
          }

          return deferred.promise;
        } else {
          return core.pageWithRange(query, criticalId, callback, size, options);
        }
      }
    },

    /**
     * Page Query with range query
     * @param query
     * @param criticalId      critical id
     * @param callback
     * @param size            Page size
     * @param options
     * {
     *  order: 1,       //page order, 1 next page, -1 prev page
     *  field: '',      //sort field name
     *  sort: 1,        //sort 1 asc, -1 desc,
     *  format: function(fieldVal){}    //format param field value
     * }
     *
     * @returns {Promise}
     * {
     *  items: [],
     *  page: {
     *    size: 2,      //page size
     *    headId: '',   //page head id
     *    tailId: '',   //page tail id
     *    count: 7,     //total count
     *    pages: 4      //total page
     *   }
     * }
     */
    pageWithRange: function(query, criticalId, callback, size, options) {
      var deferred = when.defer(), originalQry = _.cloneDeep(query || {});
      size = size || pages.default_size; options = _.extend({
        field: '_id',
        sort: -1,
        order: 1
      }, options || {});

      core.findPage(criticalId, size, query, options).toArray(function (err, items) {
        if (err) {
          deferred.reject(err);
        } else {
          var pagination = {
            size: size
          };

          if (-1 == options.order) {
            _.reverse(items);
            pagination.headId = items.length > 0 ? (items[0][options.field]) : null;
          } else {
            pagination.headId = criticalId;
          }

          pagination.tailId = items.length > 0 ? (items[items.length - 1][options.field]) : null;

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
                page: pages.wrapRange(pagination)
              });
            }
          });

        }
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
     * @param criticalId
     * @param pageSize
     * @param query
     * @param options
     * {
     *  order: 1,       //page order, 1 next page, -1 prev page, if prev page need _.reverse(items);
     *  field: '',      //sort field name
     *  sort: 1,        //sort 1 asc, -1 desc,
     *  format: function(fieldVal){}    //format param field value
     * }
     * @returns {*}
     */
    findPage: function(criticalId, pageSize, query, options) {
      options = _.extend({
        field: '_id',
        sort: -1,
        order: 1
      }, options || {});

      var condition = {}, aSort = {};
      var orginal = criticalId;

      if (core.isObjectID(criticalId)) {
        criticalId = core.toObjectID(criticalId);
      } else if (options.format && _.isFunction(options.format)) {
        criticalId = options.format(criticalId);
      }

      //desc, next
      if (options.sort == -1 && options.order == 1) {
        condition[options.field] = { $lte : criticalId };
      }
      //desc, prev
      else if (options.sort == -1 && options.order == -1) {
        options.sort = 1;
        condition[options.field] = { $gte : criticalId };
      }
      //esc, next
      else if (options.sort == 1 && options.order == 1) {
        condition[options.field] = { $gte : criticalId };
      }
      //esc, prev
      else if (options.sort == 1 && options.order == -1) {
        options.sort = -1;
        condition[options.field] = { $lte : criticalId };
      }

      //{id : -1}
      aSort[options.field] = options.sort;

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
