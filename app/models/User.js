 'use strict';

var log = log_from('user'),
  Power = app_require('models/power'),
  Role = app_require('models/role');

var model = schema({
  name: { type: 'string', required: true, allowEmpty: false },
  email: { type: 'string', format: 'email', allowEmpty: false, allowModify: false },
  passwd: { type: 'string', required: true, allowEmpty: false },
  roles: { type: 'array', uniqueItems: true },
  state: { type: 'integer', enum: [0, 1, 9], required: true, description: '0 Normal, 1 Frozen, 9 Deleted' },
  create_time: { type: 'date', required: true }
});

var user = model_bind('user', model);

 /**
  * Get user resource with cache
  * @param userId
  * @param callback
  * @returns {Promise}
  */
 user.getResource = function(userId, callback) {
  var deferred = when.defer();

  var cacheResource = userReourceCache.get(userId);
  if (cacheResource) {
    deferred.resolve(cacheResource);
  } else {
    user.findById(userId, function (err, result) {
      if (err) {
        deferred.reject(err);
      } else {
        var theRoles = [];
        _.each(result.roles || [], function (aPower) {
          theRoles.push(parseInt(aPower));
        });

        Role.find({id: {$in: theRoles}}).toArray(function (error, theRoles) {
          if (error) {
            deferred.reject(error);
          } else {
            var thePowers = [];
            _.each(theRoles || [], function (aRole) {
              _.each(aRole.powers, function (aPower) {
                thePowers.push(parseInt(aPower));
              });
            });

            Power.find({id: {$in: thePowers}}).toArray(function (error3, items) {
              if (error3) {
                deferred.reject(error3);
              } else {
                var theResources = [];
                _.each(items || [], function (item) {
                  _.each(item.resources, function (aSource) {
                    theResources.push(parseInt(aSource));
                  });
                });

                userReourceCache.set(userId, theResources);
                deferred.resolve(theResources);
              }
            });
          }
        });
      }
    });
  }

  if (_.isFunction(callback)) {
    deferred.promise.then(function (result) {
      callback(result);
    });
  }

  return deferred.promise;
 };

 /**
  * Load user resource from mongo and reload cache
  * @param userId
  * @param callback
  */
 user.loadResource = function(userId, callback) {
   userReourceCache.del(userId);
   return user.getResource(userId, callback);
 };

module.exports = user;

