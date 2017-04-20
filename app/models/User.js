 'use strict';

var Power = app_require('models/power'),
  Role = app_require('models/role'),
  Environment = app_require('models/api/env'),
  Group = app_require('models/api/group'),
  Server = app_require('models/api/server'),
  Interface = app_require('models/api/interf');

var model = schema({
  name: { type: 'string', required: true, allowEmpty: false },
  email: { type: 'string', format: 'email', allowEmpty: false },
  passwd: { type: 'string', required: true, allowEmpty: false },
  roles: { type: 'array', uniqueItems: true },
  state: { type: 'integer', enum: [0, 1, 9], required: true, const: { 0: 'Normal', 1: 'Frozen', 9: 'Deleted'} },
  create_time: { type: 'date', required: true }
});

var user = model_bind('user', model);

 /**
  * Exclude > Include if contain both in same time
  * 1: 'Include All',
  * 2: 'Include only in Define',
  * 3: 'Exclude All',
  * 4: 'Exclude only in Define'
  *
  * @see comm.SCOPE_DEFINE
  * @param scopes
  * @param excludeDefine
  * @param includeDefine
  * @returns {{}}
  */
 function scopeMerge(scopes, excludeDefine, includeDefine) {
   var mergeResult = {
     scope: 2,
     define: []
   };

   //1. Exclude All
   if (scopes.indexOf(3) != -1) {
     mergeResult = {
       scope: 3,
       define: []
     };
   }
   //2. Exclude Define && Include All
   else if (scopes.indexOf(4) != -1 && scopes.indexOf(1) != -1) {
     mergeResult = {
       scope: 4,
       define: excludeDefine
     };
   }
   //3. Exclude Define && Include Define
   else if (scopes.indexOf(4) != -1 && scopes.indexOf(2) != -1) {
     var mergerDefine = [];
     _.each(includeDefine, function (v) {
       if (excludeDefine.indexOf(v) == -1) {
         mergerDefine.push(v);
       }
     });
     mergeResult = {
       scope: 2,
       define: mergerDefine
     };
   }
   //4. Include All
   else if (scopes.indexOf(1) != -1) {
     mergeResult = {
       scope: 1,
       define: []
     };
   }
   //5. Include Define
   else if (scopes.indexOf(2) != -1) {
     mergeResult = {
       scope: 2,
       define: includeDefine
     };
   }

   return mergeResult;
 }

 /**
  * Get user resource with cache
  * Resource: {
  *   resource: [],
  *   env: [],
  *   group: [],
  *   server: {
  *       scope: 1,
  *       define: []
  *     },
  *   interface: {
  *       scope: 1,
  *       define: []
  *     }
  * }
  * @see comm.SCOPE_DEFINE
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
    user.findById(userId, function (err, definedUser) {
      if (err) {
        deferred.reject(err);
      } else {
        var theRoles = [];
        _.each(definedUser.roles || [], function (aPower) {
          theRoles.push(parseInt(aPower));
        });

        Role.find({id: {$in: theRoles}}).toArray(function (error, theRoleItems) {
          if (error) {
            deferred.reject(error);
          } else {
            var thePowers = [];
            _.each(theRoleItems || [], function (aRole) {
              _.each(aRole.powers, function (aPower) {
                thePowers.push(parseInt(aPower));
              });
            });

            Power.find({id: {$in: thePowers}}).toArray(function (error3, items) {
              if (error3) {
                deferred.reject(error3);
              } else {
                var theResources = [], theEnv = [], theGroup = [], theInnerPowers = [];
                var serverScope = [], serverIncludeDefine = [], serverExcludeDefine = [];
                var interfaceScope = [], interfaceIncludeDefine = [], interfaceExcludeDefine = [];

                _.each(items || [], function (item) {
                  if (3 == item.type) {
                    theInnerPowers.push(parseInt(item.id));
                  } else {
                    //resource
                    _.each(item.resources || [], function (aSource) {
                      theResources.push(parseInt(aSource));
                    });

                    //env
                    _.each(item.env || [], function (aEnv) {
                      theEnv.push(parseInt(aEnv));
                    });

                    //group
                    _.each(item.group || [], function (aGroup) {
                      theGroup.push(parseInt(aGroup));
                    });

                    if (_.has(item, 'server') && _.has(item.server, 'scope')) {
                      if (item.server.scope && serverScope.indexOf(item.server.scope) == -1) {
                        serverScope.push(item.server.scope);
                      }

                      if (2 == item.server.scope) {
                        _.each(item.server.define || [], function (v) {
                          var aDefine = parseInt(v);
                          if (serverIncludeDefine.indexOf(aDefine) == -1) {
                            serverIncludeDefine.push(aDefine);
                          }
                        });
                      }

                      if (4 == item.server.scope) {
                        _.each(item.server.define || [], function (v) {
                          var aDefine = parseInt(v);
                          if (serverExcludeDefine.indexOf(aDefine) == -1) {
                            serverExcludeDefine.push(aDefine);
                          }
                        });
                      }
                    }

                    if (_.has(item, 'interface') && _.has(item.interface, 'scope')) {
                      if (item.interface.scope && interfaceScope.indexOf(item.interface.scope) == -1) {
                        interfaceScope.push(item.interface.scope);
                      }

                      if (2 == item.interface.scope) {
                        _.each(item.interface.define || [], function (v) {
                          var aDefine = parseInt(v);
                          if (interfaceIncludeDefine.indexOf(aDefine) == -1) {
                            interfaceIncludeDefine.push(aDefine);
                          }
                        });
                      }

                      if (4 == item.interface.scope) {
                        _.each(item.interface.define || [], function (v) {
                          var aDefine = parseInt(v);
                          if (interfaceExcludeDefine.indexOf(aDefine) == -1) {
                            interfaceExcludeDefine.push(aDefine);
                          }
                        });
                      }
                    }
                  }
                });

                var theServer = scopeMerge(serverScope, serverExcludeDefine, serverIncludeDefine);
                var theInterface = scopeMerge(interfaceScope, interfaceExcludeDefine, interfaceIncludeDefine);

                definedUser.isAdmin = isAdminUser(definedUser);
                definedUser.innerPowers = theInnerPowers;

                var theSource = {
                  resource: theResources,
                  innerPowers: theInnerPowers
                }, definedUserId = definedUser._id.toString();

                Power.hasInnerPower('PUBLIC_LIST', function (hasPublicList) {
                  if (hasPublicList) {
                    _.extend(theSource, {
                      env: theEnv,
                      group: theGroup,
                      server: theServer,
                      interface: theInterface
                    });

                    //self environment
                    Environment.find({ 'create_by.id': definedUserId}, {id: 1}).sort({_id: -1}).toArray(function (envErr, envItems) {
                      if (envErr) {
                        deferred.reject(envErr);
                      } else {
                        _.each(envItems || [], function (envItem) {
                          theSource.env.push(envItem.id);
                        });

                        //self group
                        Group.find({ 'create_by.id': definedUserId}, {id: 1}).sort({_id: -1}).toArray(function (groupErr, groupItems) {
                          if (groupErr) {
                            deferred.reject(groupErr);
                          } else {
                            _.each(groupItems || [], function (groupItem) {
                              theSource.group.push(groupItem.id);
                            });

                            //self server
                            Server.find({ 'create_by.id': definedUserId}, {id: 1}).sort({_id: -1}).toArray(function (serverErr, serverItems) {
                              if (serverErr) {
                                deferred.reject(serverErr);
                              } else {
                                if (4 != theSource.server.scope) {
                                  _.each(serverItems || [], function (serverItem) {
                                    theSource.server.define.push(serverItem.id);
                                  });
                                }

                                //self interface
                                Interface.find({ 'create_by.id': definedUserId}, {id: 1}).sort({_id: -1}).toArray(function (interfErr, interfItems) {
                                  if (interfErr) {
                                    deferred.reject(interfErr);
                                  } else {
                                    if (4 != theSource.server.scope) {
                                      _.each(interfItems || [], function (interfItem) {
                                        theSource.interface.define.push(interfItem.id);
                                      });
                                    }

                                  }
                                });
                              }
                            });
                          }
                        });
                      }
                    });

                    userReourceCache.set(userId, theSource);
                    deferred.resolve(theSource);
                  } else {

                    //npl environment
                    Environment.find({
                      $or: [
                        {
                          id: { $in: theEnv},
                          'create_by.id': definedUserId
                        },
                        {
                          'create_by.id': definedUserId
                        }
                      ]
                    }, {id:1}).sort({_id: -1}).toArray(function (envErr, envItems) {
                      if (envErr) {
                        deferred.reject(envErr);
                      } else {
                        var nplEnv = []; _.each(envItems || [], function (envItem) {
                          nplEnv.push(envItem.id);
                        });
                        _.extend(theSource, { env: nplEnv});

                        //npl group
                        Group.find({
                          $or: [
                            {
                              id: { $in: theGroup},
                              'create_by.id': definedUserId
                            },
                            {
                              'create_by.id': definedUserId
                            }
                          ]
                        }, {id:1}).sort({_id: -1}).toArray(function (groupErr, groupItems) {
                          if (groupErr) {
                            deferred.reject(groupErr);
                          } else {
                            var nplGroup = []; _.each(groupItems || [], function (groupItem) {
                              nplGroup.push(groupItem.id);
                            });
                            _.extend(theSource, { group: nplGroup});


                            //npl server
                            Server.find({
                              $or: [
                                {
                                  id: { $in: theServer.define},
                                  'create_by.id': definedUserId
                                },
                                {
                                  'create_by.id': definedUserId
                                }
                              ]
                            }, {id:1}).sort({_id: -1}).toArray(function (serverErr, serverItems) {
                              if (serverErr) {
                                deferred.reject(serverErr);
                              } else {
                                var nplServer = []; _.each(serverItems || [], function (serverItem) {
                                  nplServer.push(serverItem.id);
                                });
                                theServer.define = nplServer;
                                _.extend(theSource, { server: theServer});


                                //npl interface
                                Interface.find({
                                  $or: [
                                    {
                                      id: { $in: theInterface.define},
                                      'create_by.id': definedUserId
                                    },
                                    {
                                      'create_by.id': definedUserId
                                    }
                                  ]
                                }, {id:1}).sort({_id: -1}).toArray(function (interfErr, interfItems) {
                                  if (interfErr) {
                                    deferred.reject(interfErr);
                                  } else {
                                    var nplInterf = []; _.each(interfItems || [], function (interfItem) {
                                      nplInterf.push(interfItem.id);
                                    });
                                    theInterface.define = nplInterf;
                                    _.extend(theSource, { interface: theInterface});


                                    //npl finish
                                    userReourceCache.set(userId, theSource);
                                    deferred.resolve(theSource);
                                  }
                                });
                              }
                            });
                          }
                        });
                      }
                    });
                  }

                }, definedUser);
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

