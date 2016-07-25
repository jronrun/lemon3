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

function getRespAPI(api, usr) {
  var respAPI = {
    id: api.id,
    name: api.name,
    desc: api.desc,
    mutation: api.mutation,
    mutation_host: api.mutation_host || 0,
    request: api.request,
    response: api.response,
    request_doc: api.request_doc,
    response_doc: api.response_doc
  };

  if (usr) {
    _.extend(respAPI, {
      owner: items.ownInterface(usr, api.id) ? 2 : 1
    });
  }

  if (2 == respAPI.owner) {
    _.extend(respAPI, {
      _id: api._id
    });
  }

  return respAPI;
}

module.exports = function(commOptions) {
  var permission = 'There is no authority for %s';
  commOptions = _.extend({}, commOptions || {});

  var apiRequest = {
    getRespAPI: getRespAPI,
    request: function(options, resultCall, usr, requestOptions) {
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
          var servRequ = target.serv.request, theResp = {};
          target.isChosenAPI = false;

          if (servRequ.interf_prop && target.api) {
            if (_.get(target.requ, servRequ.interf_prop) == _.get(target.api.request, servRequ.interf_prop)) {
              target.isChosenAPI = true;
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
              data: theParam
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
            var servRequ = target.serv.request, history = {
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
                name: target.serv.name,
                url: target.serv.url
              },
              api: {
                request: target.requ
              },
              user: {
                id: usr.id,
                name: usr.name,
                ip: requestOptions.ip || ''
              },
              create_time: new Date()
            };

            if (target.isChosenAPI) {
              if (target.api) {
                _.extend(history.api, {
                  id: target.api.id,
                  mutation: target.api.mutation,
                  name: target.api.name,
                  desc: target.api.desc
                });
              }
            }
            //not choose API
            else {
              if (servRequ.interf_prop) {
                _.extend(history.api, {
                  name: _.get(target.requ, servRequ.interf_prop)
                });
              }
            }

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

    setHisNote: function(historyId, note, callback) {
      note = crypto.decompress(note);

      History.updateOne({
        id: historyId
      }, {
        $set: {
          note: note
        }
      }, function(err, result) {
        _.isFunction(callback) && callback();
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
          "api.response": response,
          "api.json": json
        }
      }, function(err, result) {
        _.isFunction(callback) && callback();
      });
    },

    nextHistory: function(lastId, isPrev, callback) {
      lastId = lastId || -1;
      async.waterfall([
        function (callback) {
          if (-1 == lastId) {
            History.lastId(function (theLastId) {
              if (isPrev) {
                lastId = theLastId + 1;
              } else {
                lastId = theLastId - 1;
              }
              callback(null, lastId);
            });
          } else {
            callback(null, lastId);
          }
        },
        function(lastId, callback) {
          var qry = null, sort = null;
          if (isPrev) {
            qry = {id: {$lt: lastId}};
            sort = {id: -1};
          } else {
            qry = {id: {$gt: lastId}};
            sort = {id: 1};
          }

          History.find(qry).limit(1).sort(sort).next(function(err, his) {
            if (err) {
              callback(null, answer.fail(err.message));
            }

            callback(null, answer.succ({
              item: his
            }));
          });
        }
      ], function (err, answer) {
        callback(answer);
      });
    },

    qryHistory: function(query, pn, callback, ps, options) {
      History.page(query || {}, pn, false, ps, _.extend({
        sorts: {
          id: -1
        }
      }, options || {})).then(function (result) {
        callback(answer.succ({
          items: result.items,
          hasNext: result.page.hasNext
        }));
      });
    },

    /**
     *
     * @param params   { serv: 1, requ: {}, api: 1}
     * @param resultCall
     * @returns {*}
       */
    apiDefine: function(params, resultCall, notUseChooseIfRequNoDefine, usr) {
      var defineNone = answer.succ({ item: null });
      if (!params.serv || !params.requ) {
        return resultCall(defineNone);
      }

      async.waterfall([
        function (callback) {
          Server.find({id: parseInt(params.serv)}).limit(1).next(function(err, serv) {
            if (err) {
              return resultCall(answer.fail(err.message));
            }

            if (!serv) {
              return resultCall(defineNone);
            }

            var target = {
              serv: serv,
              requ: params.requ
            };
            callback(null, target);
          });
        },

        function(target, callback) {
          if (params.api) {
            Interface.find({id: parseInt(params.api)}).limit(1).next(function(err, api) {
              if (api) {
                target.api = api;
                callback(null, target);
              } else {
                callback(null, target);
              }
            });
          } else {
            callback(null, target);
          }
        },

        function(target, callback) {
          var servRequ = target.serv.request;
          //Single interface
          if (1 == servRequ.type) {
            if (!target.api) {
              return resultCall(defineNone);
            } else {
              callback(null, answer.succ({ item: getRespAPI(target.api, usr) }));
            }
          }
          //Multi-interface
          else if (2 == servRequ.type) {
            //choose & editor match
            if (target.api && target.requ
              && (_.get(target.requ, servRequ.interf_prop) == _.get(target.api.request, servRequ.interf_prop))) {
              callback(null, answer.succ({ item: getRespAPI(target.api, usr) }));
            } else {
              var cmdFromRequ = _.get(target.requ, servRequ.interf_prop);
              //editor
              if (cmdFromRequ && cmdFromRequ.length > 0) {
                Interface.find({name: cmdFromRequ}).limit(1).next(function(err, api) {
                  //editor
                  if (api) {
                    callback(null, answer.succ({ item: getRespAPI(api, usr) }));
                  }
                  //choose
                  else if (target.api) {
                    if (notUseChooseIfRequNoDefine) {
                      return resultCall(defineNone);
                    } else {
                      callback(null, answer.succ({ item: getRespAPI(target.api, usr) }));
                    }
                  }
                  //none match
                  else {
                    return resultCall(defineNone);
                  }
                });
              }
              //choose
              else if (target.api) {
                if (notUseChooseIfRequNoDefine) {
                  return resultCall(defineNone);
                } else {
                  callback(null, answer.succ({ item: getRespAPI(target.api, usr) }));
                }
              }
              //none match
              else {
                return resultCall(defineNone);
              }
            }
          }
        },

        function(anAnswer, callback) {
          var apiItem = anAnswer.result.item;
          if (0 == anAnswer.code
            && null != apiItem
            && 2 == apiItem.mutation
            && apiItem.mutation_host > 0) {

            Interface.find({id: apiItem.mutation_host}).limit(1).next(function(err, hostApi) {
              if (!err && hostApi) {
                if (items.ownInterface(usr, hostApi.id)) {
                  _.extend(anAnswer.result, {
                    host: getRespAPI(hostApi, usr)
                  });
                }

                callback(null, anAnswer);
              } else {
                callback(null, anAnswer);
              }
            });
          } else {
            callback(null, anAnswer);
          }
        }
      ], function(err, anAnswer) {
        return resultCall(anAnswer);
      });
    }
  };

  return apiRequest;
};
