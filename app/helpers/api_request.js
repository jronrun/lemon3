'use strict';

var log = log_from('api_request'),
  qs = require('qs'),
  request = require('request'),
  items = require('./items'),
  Environment = app_require('models/api/env'),
  Group = app_require('models/api/group'),
  Server = app_require('models/api/server'),
  Interface = app_require('models/api/interf'),
  History = app_require('models/api/history');

module.exports = function(usr, commOptions) {
  var permission = 'There is no authority for %s';
  commOptions = _.extend({}, commOptions || {});

  var apiRequest = {

    request: function(options, resultCall, requestOptions) {
      options = _.extend({
        envId: null,
        groupId: null,
        servId: null,
        apiId: null,
        requ: null
      }, options || {});

      requestOptions = _.extend({
        ip: '',
        opt: 0                // 1 {path: '', data: {}, 'param_name'}
      }, requestOptions || {});

      async.waterfall([
        function (callback) {
          var target = {};
          var requ = crypto.decompress(options.requ);
          try {
            requ = convertData(json5s.parse(requ));
            target.requ = requ;
          } catch (e) {
            return resultCall(answer.fail('invalid request data: ' + e.message));
          }

          options.envId = parseInt(options.envId);
          options.groupId = parseInt(options.groupId);
          options.servId = parseInt(options.servId);
          options.apiId = parseInt(options.apiId || '-1');

          callback(null, target);
        },
        function (target, callback) {
          Environment.find({id: options.envId}).limit(1).next(function(err, env) {
            if (err) {
              return resultCall(answer.fail(err.message));
            }

            if (!items.ownEnv(usr, options.envId)) {
              return resultCall(answer.fail(format(permission, env.name)));
            }

            target.env = env;
            callback(null, target);
          });
        },

        function(target, callback) {
          Group.find({id: options.groupId}).limit(1).next(function(err, group) {
            if (err) {
              return resultCall(answer.fail(err.message));
            }

            if (!items.ownGroup(usr, options.groupId)) {
              return resultCall(answer.fail(format(permission, group.name)));
            }

            target.group = group;
            callback(null, target);
          });
        },

        function(target, callback) {
          Server.find({id: options.servId}).limit(1).next(function(err, serv) {
            if (err) {
              return resultCall(answer.fail(err.message));
            }

            if (!items.ownServer(usr, options.servId)) {
              return resultCall(answer.fail(format(permission, serv.name)));
            }

            target.serv = serv;
            callback(null, target);
          });
        },

        function(target, callback) {
          if (options.apiId && -1 != options.apiId) {
            Interface.find({id: options.apiId}).limit(1).next(function(err, interf) {
              if (err) {
                return resultCall(answer.fail(err.message));
              }

              target.api = interf;
              callback(null, target);
            });
          } else {
            target.api = null;
            callback(null, target);
          }
        },

        function(target, callback) {
          var servRequ = target.serv.request, theResp = {}, isChosenAPI = false;

          if (servRequ.interf_prop && target.api) {
            if (_.get(target.requ, servRequ.interf_prop) == _.get(target.api.request, servRequ.interf_prop)) {
              isChosenAPI = true;
              if (!items.ownInterface(usr, options.apiId)) {
                return resultCall(answer.fail(format(permission, target.api.name)));
              }
            }
          }

          _.extend(target.requ, servRequ.add_params || {});

          var theParam = {};
          switch (servRequ.type) {
            //Single interface
            case 1:
              theParam = target.requ;
              break;

            //Multi-interface
            case 2:
              theParam[servRequ.param_name] = JSON.stringify(target.requ);
              break;
          }

          //{path: '', data: {}, param_name: ''}
          if (1 == requestOptions.opt) {
            _.extend(theResp, {
              path: target.serv.url,
              data: theParam,
              param_name: servRequ.param_name
            });

            callback(null, target, answer.succ(theResp));
          }
          //do request
          else if (0 == requestOptions.opt) {
            //jsonp
            if ('JSONP' == servRequ.method) {
              _.extend(theResp, {
                path: target.serv.url,
                data: theParam,
                param_name: servRequ.param_name
              });

              callback(null, target, answer.succ(theResp));
            }
            //Other method
            else {
              var headers = {}, reqOptions = {};

              _.extend(reqOptions, {
                url: target.serv.url,
                method: servRequ.method,
                headers: headers
              });

              if (_.indexOf(['PATCH', 'POST', 'PUT'], servRequ.method) != -1) {
                _.extend(reqOptions, {
                  body: theParam,
                  json: true
                });
              }
              //
              else if (_.indexOf(['GET', 'DELETE'], servRequ.method) != -1) {
                _.extend(reqOptions, {
                  qs: theParam
                });
              }
              //
              else {
                return resultCall(answer.fail('Unsupport method ' + servRequ.method));
              }

              //http://blog.modulus.io/node.js-tutorial-how-to-use-request-module
              request(reqOptions, function(error, response, body) {
                if(error){
                  return resultCall(answer.fail(error.message, error));
                }

                log.info('response', JSON.stringify(response));
                log.info('body', JSON.stringify(body));

                callback(null, target, answer.resp(2, theResp));
              });
            }
          } else {
            return resultCall(answer.fail('Unknown option ' + requestOptions.opt));
          }

        },

        function(target, answer, callback) {
          if (0 == requestOptions.opt) {
            var history = {
              env: {
                id: target.env.id,
                name: target.env.name,
                level: target.env.alert_level
              },
              group: {
                id: target.group.id,
                name: target.group.name
              },
              serv: {
                id: target.serv.id,
                name: target.serv.name
              },
              interf: {
                request: target.requ
              },
              user: {
                id: usr.id,
                name: usr.name,
                ip: requestOptions.ip || ''
              },
              create_time: new Date()
            };

            History.nextId(function (id) {
              history.id = id;

              History.insertOne(history, function(err, result) {
                if (err) {
                  return resultCall(answer.fail(err.message));
                }

                if (1 != result.insertedCount) {
                  return resultCall(answer.fail('Request fail, Try again?'));
                }

                answer.result.hisId = id;
                callback(null, answer);
              });
            });
          } else {
            callback(null, answer);
          }
        }
      ], function(err, result) {
        resultCall(result);
      });
    },

    setHisResp: function(historyId, response, callback) {
      var response = crypto.decompress(response), json = false;
      try {
        response = convertData(json5s.parse(response));
        json = true;
      } catch (e) {
      }

      History.updateOne({
        id: historyId
      }, {
        $set: {
          "interf.response": response,
          "interf.json": json
        }
      }, function(err, result) {
        _.isFunction(callback) && callback();
      });
    }
  };

  return apiRequest;
};
