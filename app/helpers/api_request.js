'use strict';

var log = log_from('api_request'),
  qs = require('qs'),
  request = require('request'),
  items = require('./items'),
  Share = app_require('models/share'),
  ShareAccess = app_require('models/share_access'),
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
    group_id: api.group_id,
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

function parseExecutableAPICapture(apiCapture) {
  var parseR = { env: {}, group: {}, serv: {}, api: {} }, cur = null;
  if (!(cur = apiCapture.cur)) {
    return parseR;
  }

  if (cur.env && cur.env.id) {
    parseR.env = cur.env;
  }

  if (cur.serv && cur.serv.id) {
    parseR.serv = cur.serv;
  }

  if (cur.apiGroup && cur.apiGroup.id) {
    parseR.group = cur.apiGroup;
  } else if (cur.envGroup && cur.envGroup.id) {
    parseR.group = cur.envGroup;
  }

  if (cur.api && cur.api.id) {
    parseR.api = cur.api;
  }

  return parseR;
}

module.exports = function(commOptions) {
  var permission = 'There is no authority for %s';
  commOptions = _.extend({}, commOptions || {});

  var apiRequest = {
    getRespAPI: getRespAPI,
    request: function(options, resultCall, requestInfo, requestOptions) {
      var usr = requestInfo.usr;
      options = _.extend({
        envId: null,
        groupId: null,
        servId: null,
        apiId: null,
        requ: null
      }, options || {});

      requestOptions = _.extend({
        ip: '',
        share: null,           // share
        opt: 0,                // 1 {path: '', data: {}, 'param_name'}
        checkGroup: 0          // 0 uncheck, 1 check server and api group match
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
          if (1 == requestOptions.checkGroup) {
            if (!target.api) {
              return resultCall(answer.fail('please choose an api'));
            }

            if (target.serv.group_id != target.api.group_id) {
              return resultCall(answer.fail('make sure the chosen environment and chosen api are the same group'));
            }
          }

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

          var theParam = {}; target.headers = {};
          switch (servRequ.type) {
            //Single interface
            case 1:
              theParam = target.requ;
              if (target.api) {
                target.isChosenAPI = true;
              }
              break;

            //Multi-interface
            case 2:
              theParam[servRequ.param_name] = JSON.stringify(target.requ);
              break;
          }

          _.extend(theParam, (options.advance || {}).params || {});
          _.extend(target.headers, (options.advance || {}).headers || {});

          if (!_.isEmpty(target.requ.headers || {})) {
            _.extend(target.headers, target.requ.headers);
          }

          //{path: '', data: {}, param_name: ''}
          if (1 == requestOptions.opt) {
            _.extend(theResp, {
              path: target.serv.url,
              data: theParam,
              headers: target.headers
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
                headers: target.headers,
                param_name: servRequ.param_name
              });

              callback(null, target, answer.succ(theResp));
            }
            //Other method
            else {
              var reqOptions = {}; _.extend(reqOptions, {
                url: target.serv.url,
                method: servRequ.method,
                headers: target.headers
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

                if (!response) {
                  return resultCall(answer.fail('none response'));
                }

                var theBody = {}, bodyParse = deepParse(response.body, true), jsonBody = false;
                if (jsonBody = bodyParse.isSucc()) {
                  theBody = bodyParse.get();
                } else {
                  theBody = {
                    body: response.body
                  };
                }

                if (200 == response.statusCode) {
                  theResp.data = theBody;
                } else {
                  theResp.data = {
                    statusCode: response.statusCode,
                    body: jsonBody ? theBody : theBody.body,
                    headers: response.headers,
                    request: response.request.toJSON()
                  };
                }

                log.info('response', JSON.stringify(response));

                callback(null, target, answer.resp(2, theResp));
              });
            }
          } else {
            return resultCall(answer.fail('Unknown option ' + requestOptions.opt));
          }

        },

        function(target, requestAns, callback) {
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
                url: target.serv.url,
                type: servRequ.type,
                method: servRequ.method,
                add_params: servRequ.add_params
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

            if (!_.isEmpty(target.headers)) {
              _.extend(history.api.request, {
                headers: target.headers
              });
            }

            //Already has response
            if (2 == requestAns.code) {
              var theResp = requestAns.result;
              _.extend(history.api, {
                json: true,
                response: theResp.data
              });
            }

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

                requestAns.result.hisId = id;
                callback(null, requestAns);
              });
            });
          } else {
            callback(null, requestAns);
          }
        },

        function(theAns, callback) {
          // is share execute
          if (requestOptions.share) {
            var shareId = requestOptions.share._id.toString();
            ShareAccess.add({
              type: 2,
              history: theAns.result.hisId,
              share_id: requestOptions.share.id,
              share: shareId,
              share_read_write: requestOptions.share.read_write
            }, function (accessAns) {
              if (!isAnswerSucc(accessAns)) {
                log.warn(accessAns.msg, 'ShareAccess.add');
              }

              Share.addUseCount(shareId, function(adducAns) {
                if (!isAnswerSucc(adducAns)) {
                  log.warn(adducAns.msg, 'Share.addUseCount');
                }

                callback(null, theAns);
              }, requestInfo);

            }, requestInfo);
          } else {
            callback(null, theAns);
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
      ], function (err, theAns) {
        callback(theAns);
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
     * @param requData
     * @see apiRequest.apiDefine  params
     * @param sourceData {source: '', sid: ''}
       */
    executeAPIShareSource: function(requData, sourceData, execResultCall, requestInfo) {
      var resultCall = function (execAns) {
        if (isAnswerSucc(execAns)) {
          execResultCall(execAns);
        } else {
          if (sourceData && sourceData.source) {
            var source = crypto.decompress(sourceData.source);
            if (source && source.length > 0) {
              ShareAccess.add({
                type: 4,
                fail: execAns.msg,
                share_id: 0,
                share_read_write: 4,
                share: source
              }, function (accessAns) {
                if (!isAnswerSucc(accessAns)) {
                  log.warn(accessAns.msg, 'Try Execute ShareAccess.add');
                }

                execResultCall(execAns);
              }, requestInfo);
            } else {
              execResultCall(execAns);
            }
          } else {
            execResultCall(execAns);
          }

        }
      };

      if (!requData || !requData.serv || !requData.requ) {
        return resultCall(answer.fail('invalid request data'));
      }

      var shareRequData = _.cloneDeep(requData), requDataRequAns = deepParse(requData.requ);
      if (requDataRequAns.isFail()) {
        return resultCall(requDataRequAns.target);
      }

      _.extend(shareRequData, {
        requ: requDataRequAns.get(),
        checkServAndAPIGroupMatch: 1
      });

      async.waterfall([
        function(callback) {
          apiRequest.isExecutableAPIShareSource(sourceData, function(execIsAns) {
            var execIsAnsWrap = ansWrap(execIsAns);
            if (execIsAnsWrap.isFail()) {
              return resultCall(execIsAnsWrap.target);
            }

            callback(null, execIsAnsWrap.get());
          }, requestInfo);
        },

        function(target, callback) {
          if (!target.env || !target.group || !target.serv || !target.api) {
            return resultCall(answer.fail('invalid executable share source'));
          }

          apiRequest.apiDefine(shareRequData, function(theAns) {
            var anAPI = theAns.result.item, anServ = theAns.result.serv;
            if (target.env != anServ.env_id) {
              return resultCall(answer.fail('not the share environment'));
            }

            if (target.group != anServ.group_id) {
              return resultCall(answer.fail('not the share group'));
            }

            if (target.serv != anServ.id) {
              return resultCall(answer.fail('not the share server'));
            }

            if (target.api != anAPI.id) {
              return resultCall(answer.fail('not the share api'));
            }

            callback(null, target);

          }, true, requestInfo.usr);

        }
      ], function(err, result) {
        return resultCall(answer.succ(result));
      });
    },

    isExecutableAPIShareSource: function(sourceData, resultCall, requestInfo) {
      if (!sourceData || !sourceData.source) {
        return resultCall(answer.fail('none share source data'));
      }

      var source = crypto.decompress(sourceData.source);
      if (!source || source.length < 1) {
        return resultCall(answer.fail('none share source'));
      }

      async.waterfall([
        function(callback) {
          Share.findById(source, function (err, aShare) {
            if (err) {
              return resultCall(answer.fail(err.message));
            }

            if (!aShare) {
              return resultCall(answer.fail('share source not exists.'));
            }

            if ([2, 3].indexOf(aShare.read_write) == -1) {
              return resultCall(answer.fail('not executable share source'));
            }

            if (2 == aShare.read_write && requestInfo.anonymous) {
              return resultCall(answer.fail('user power share source need login'));
            }

            if ([1, 2, 3, 7].indexOf(aShare.type) == -1) {
              return resultCall(answer.fail('not single api about share source'));
            }

            var ans = Share.isAvailable(aShare, requestInfo);
            if (!isAnswerSucc(ans)) {
              return resultCall(ans);
            }

            var target = {
              share: aShare
            };

            callback(null, target);
          });
        },

        function(target, callback) {
          var share = target.share;

          //API
          if (1 == share.type) {
            Interface.findById(crypto.decompress(share.content), function (err, anInterf) {
              if (err) {
                return resultCall(answer.fail(err.message));
              }

              if (!anInterf) {
                return resultCall(answer.fail('share API not exists'));
              }

              Group.find({id : anInterf.group_id}).limit(1).next(function(err, aGroup) {
                if (err) {
                  return resultCall(answer.fail(err.message));
                }

                if (!aGroup) {
                  return resultCall(answer.fail('share API Group not exists'));
                }

                _.extend(target, {
                  group: aGroup.id,
                  api: anInterf.id
                });

                callback(null, target);
              });
            });
          }
          //API History
          else if (3 == share.type) {
            var hisId = crypto.decompress(share.content), qry = {};
            if (History.isObjectID(String(hisId))) {
              qry = { _id: History.toObjectID(hisId)};
            } else {
              qry = { id: parseInt(hisId)};
            }

            History.find(qry).limit(1).next(function(err, aHis) {
              if (err) {
                return resultCall(answer.fail(err.message));
              }

              if (!aHis) {
                return resultCall(answer.fail('share API history not exists'));
              }

              _.extend(target, {
                env: aHis.env.id,
                group: aHis.group.id,
                serv: aHis.serv.id,
                api: aHis.api.id
              });

              callback(null, target);
            });
          }
          //API Capture
          else if (2 == share.type) {
            var apicAns = deepParse(share.content);
            if (apicAns.isFail()) {
              return resultCall(apicAns);
            }

            var apicR = parseExecutableAPICapture(apicAns.get());
            _.extend(target, {
              env: apicR.env.id,
              group: apicR.group.id,
              serv: apicR.serv.id,
              api: apicR.api.id
            });

            callback(null, target);
          }
          //APIs Capture
          else if (7 == share.type) {
            if (!sourceData.sid) {
              return resultCall(answer.fail('none source id'));
            }

            var apiscAns = deepParse(share.content);
            if (apiscAns.isFail()) {
              return resultCall(apiscAns);
            }

            var apisCapture = null;
            _.each(apiscAns.get(), function (inst) {
              if (inst.id.toString() == sourceData.sid.toString) {
                apisCapture = inst.snapdata;
                return false;
              }
            });

            var apicR = parseExecutableAPICapture(apisCapture);
            _.extend(target, {
              env: apicR.env.id,
              group: apicR.group.id,
              serv: apicR.serv.id,
              api: apicR.api.id
            });

            callback(null, target);
          }

        },

        function(target, callback) {
          var share = target.share;
          target.env = target.env || 0;
          target.group = target.group || 0;
          target.serv = target.serv || 0;
          target.api = target.api || 0;

          //user power
          if (2 == share.read_write) {
            var tip = 'user ' + requestInfo.usr.name + ' has no authority for shared %s';
            if (target.env) {
              if (!items.ownEnv(requestInfo.usr, target.env)) {
                return resultCall(answer.fail(format(permission, 'environment')));
              }
            }

            if (target.group) {
              if (!items.ownGroup(requestInfo.usr, target.group)) {
                return resultCall(answer.fail(format(permission, 'group')));
              }
            }

            if (target.serv) {
              if (!items.ownServer(requestInfo.usr, target.serv)) {
                return resultCall(answer.fail(format(permission, 'server')));
              }
            }

            if (target.api) {
              if (!items.ownInterface(requestInfo.usr, target.api)) {
                return resultCall(answer.fail(format(permission, 'interface')));
              }
            }
          }

          callback(null, target);
        }
      ], function(err, result) {
        return resultCall(answer.succ(result));
      });
    },

    /**
     *
     * @param params   { serv: 1, requ: {}, api: 1, getHostIfMutation: 0, checkServAndAPIGroupMatch: 0}
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
              callback(null, answer.succ({
                serv: target.serv,
                item: getRespAPI(target.api, usr)
              }));
            }
          }
          //Multi-interface
          else if (2 == servRequ.type) {
            //choose & editor match
            if (target.api && target.requ
              && (_.get(target.requ, servRequ.interf_prop) == _.get(target.api.request, servRequ.interf_prop))) {
              callback(null, answer.succ({
                serv: target.serv,
                item: getRespAPI(target.api, usr)
              }));
            } else {
              var cmdFromRequ = _.get(target.requ, servRequ.interf_prop);
              //editor
              if (cmdFromRequ && cmdFromRequ.length > 0) {
                Interface.find({name: cmdFromRequ}).limit(1).next(function(err, api) {
                  //editor
                  if (api) {
                    callback(null, answer.succ({
                      serv: target.serv,
                      item: getRespAPI(api, usr)
                    }));
                  }
                  //choose
                  else if (target.api) {
                    if (notUseChooseIfRequNoDefine) {
                      return resultCall(defineNone);
                    } else {
                      callback(null, answer.succ({
                        serv: target.serv,
                        item: getRespAPI(target.api, usr)
                      }));
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
                  callback(null, answer.succ({
                    serv: target.serv,
                    item: getRespAPI(target.api, usr)
                  }));
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
          if (1 == (params.checkServAndAPIGroupMatch || 0)) {
            if (apiItem.group_id != anAnswer.result.serv.group_id) {
              return resultCall(defineNone);
            }
          }

          if (0 == anAnswer.code
            && 1 == (params.getHostIfMutation || 0)
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
