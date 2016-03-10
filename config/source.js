var Type = require('./resource/type'),
  Method = require('./resource/method'),
  Schema = require('./resource/schema');

/**
 {
  id: 1,                  // require number, Resource Unique ID
  name: 'name',           // require string, Resource Name
  desc: 'desc',           // require string, Resource Description
  pid: 0,                 // [optional] default 0 or top level resource unique id, parent resource unique id
  action: '/',            // [optional] default is same as name, resource URI
  type: Type.page,        // [optional] default Type.page, resource type
  method: Method.GET      // [optional] default is Method.GET, HTTP Method
  children: [],           // [optional] default is null, children resource

  do: '/',                // [Auto Generator], action: '/user/vip/' when pid == 0 is '/'
                          // action: '/user/vip/put' when pid > 0 is '/put'
  base: '',               // [Auto Generator] Top Level Action, pid == 0 is ''
  baseId: 1,              // [Auto Generator] Top Level ID, pid == 0 is resource ID
  page: '',               // [optional || Auto Generator] Page, If type == Type.page, when pid == 0 is '{name]/index',
   else
   same as Action
 }
 */
var resource = [
  { id: 10, name: 'home', action: '/', desc: 'Home', page: 'index' },

  { id: 20, name: 'notebook', desc: 'Notebook'},

  { id: 30, name: 'user', desc: 'User', children: [
    {id: 30001, name: 'signin', desc: 'Sign In'},
    {id: 30002, name: 'signout', desc: 'Sign Out'},
    {id: 30003, name: 'signup', desc: 'Sign Up'}
  ]},

  { id: 200, name: 'manage', desc: 'Manage', children: [

  ]}
];

module.exports = { type: Type, method: Method, schema: Schema, items: resource };
