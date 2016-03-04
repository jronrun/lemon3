var Type = require('./resource/type'),
  Method = require('./resource/method'),
  Schema = require('./resource/schema');

/**
 {
  id: 1,                  // require number, Resource Unique ID
  name: 'name',           // require string, Resource Name
  desc: 'desc',           // require string, Resource Description
  pid: 0,                 // [optional] default 0 or top level resource unique id, parent resource unique id
  action: '/',            // [optional] default is '/', resource URI
  type: Type.URL,         // [optional] default Type.URL, resource type
  method: Method.GET      // [optional] default is Method.GET, HTTP Method
  children: [],           // [optional] default is null, children resource

  do: '/',                // [Auto Generator], action: '/user/vip/' when pid == 0 is '/'
                          // action: '/user/vip/put' when pid > 0 is '/put'
  base: '',               // [Auto Generator] Top Level Action, pid == 0 is ''
  baseId: 1,              // [Auto Generator] Top Level ID, pid == 0 is resource ID
 }
 */
var resource = [
  { id: 10, name: 'home', action: '/', desc: '首页' },

  { id: 20, name: 'notebook', action: 'notebook', desc: '记事本'},

  { id: 30, name: 'user', action: 'user', desc: '用户'}
];

module.exports = { type: Type, method: Method, schema: Schema, items: resource };
