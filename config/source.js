'use strict';

var setting = require('./resource/setting'), T = setting.type, P = setting.page,
  M = require('./resource/method'), Schema = require('./resource/schema');

/**
 {
  id: 1,                  // require number, Resource Unique ID
  name: 'name',           // require string, Resource Name
  desc: 'desc',           // require string, Resource Description
  pid: 0,                 // [optional] default 0 or top level resource unique id, parent resource unique id
  action: '/',            // [optional] default is same as name, resource URI
  type: T.page,           // [optional] default T.page, resource type
  method: Method.GET      // [optional] default is Method.GET, HTTP Method
  children: [],           // [optional] default is null, children resource
  extend: 0,              // [optional] Extend Resource,
  protect: true,          // [optional] Resource is protected, default is true

  do: '/',                // [Auto Generator], action: '/user/vip/' when pid == 0 is '/'
                          // action: '/user/vip/put' when pid > 0 is '/put'
  base: '',               // [Auto Generator] Top Level Action, pid == 0 is ''
  baseId: 1,              // [Auto Generator] Top Level ID, pid == 0 is resource ID
  page: '',               // [optional || Auto Generator] Page, If type == T.page,
                          // when pid == 0 is '{name]/index', else same as Action
 }
 */
var resource = [
  {id: 10, name: 'home', action: '/', desc: 'Home', page: 'index', protect: false},

  {id: 20, name: 'notebook', desc: 'Notebook'},

  {
    id: 30, name: 'user', desc: 'User', children: [
      {id: 30001, name: 'signin', desc: 'Sign In', protect: false},
      {id: 30002, extend: 30001, method: M.POST},

      {id: 30003, name: 'signout', desc: 'Sign Out', protect: false},

      {id: 30004, name: 'signup', method: M.POST, desc: 'Sign Up', protect: false},
      {id: 30005, extend: 30004, method: M.POST}
    ]
  },

  {id: 50, name: 'api', desc: 'Manual API', protect: false, children: [] },

  {id: 60, name: 'general', desc: 'General', protect: false, children: [
      {id: 60001, name: 'form', desc: 'Form', method: M.POST, protect: false},
      {id: 60002, name: 'convert', desc: 'Data Convert', method: M.POST, protect: false}
    ]
  },

  {
    id: 200, name: 'manage', desc: 'Manage', children: [
      {
        id: 200000, name: 'dashboard', desc: 'Dashboard', children: []
      },

      {
        id: 200001, name: 'powers', desc: 'Powers', action: '/manage/powers/:page', page: P.list, children: [
          {id: 2000011, name: 'editor', action: '/manage/power', page: P.edit, desc: 'Editor'},
          {id: 2000012, extend: 2000011, method: M.POST, page: P.list, desc: 'Create'},

          {id: 2000013, name: 'retrieve', action: '/manage/power/:id', page: P.edit, desc: 'Retrieve'},
          {id: 2000014, extend: 2000013, method: M.PUT, page: P.list, desc: 'Update'},
          {id: 2000015, extend: 2000013, method: M.DELETE, page: P.list, desc: 'Delete'}
        ]
      },

      {
        id: 200002, name: 'roles', desc: 'Roles', action: '/manage/roles/:page', page: P.list, children: [
          {id: 2000021, name: 'editor', action: '/manage/role', page: P.edit, desc: 'Editor'},
          {id: 2000022, extend: 2000021, method: M.POST, page: P.list, desc: 'Create'},

          {id: 2000023, name: 'retrieve', action: '/manage/role/:id', page: P.edit, desc: 'Retrieve'},
          {id: 2000024, extend: 2000023, method: M.PUT, page: P.list, desc: 'Update'},
          {id: 2000025, extend: 2000023, method: M.DELETE, page: P.list, desc: 'Delete'}
        ]
      },

      {
        id: 200003, name: 'users', desc: 'Users', action: '/manage/users/:page', page: P.list, children: [
        {id: 2000031, name: 'editor', action: '/manage/user', page: P.edit, desc: 'Editor'},
        {id: 2000032, extend: 2000031, method: M.POST, page: P.list, desc: 'Create'},

        {id: 2000033, name: 'retrieve', action: '/manage/user/:id', page: P.edit, desc: 'Retrieve'},
        {id: 2000034, extend: 2000033, method: M.PUT, page: P.list, desc: 'Update'},
        {id: 2000035, extend: 2000033, method: M.DELETE, page: P.list, desc: 'Delete'}
      ]
      },

      {
        id: 200004, name: 'resource', desc: 'Resource', method: M.POST, children: [
          {id: 2000041, name: 'power', desc: 'Power Resource', action: '/manage/resource/power/:id', method: M.POST},
          {id: 2000042, name: 'role', desc: 'Role Resource', action: '/manage/resource/role/:id', method: M.POST},
          {id: 2000043, name: 'user', desc: 'User Resource', action: '/manage/resource/user/:id', method: M.POST}
        ]
      }
    ]
  }
];

/**
 {
  sourceId: null,       // Resource unique ID, if null then as node
  name: null,           // Menu name, using resource desc if null
  children: [],         // children menu
 }
 */
var menu = [
  {name: 'Dashboard', sourceId: 200000},
  {
    name: 'Users', children: [
      {sourceId: 200003, args: '1'}
    ]
  },
  {
    name: 'Settings', children: [
      {sourceId: 200001, args: '1'},
      {sourceId: 200002, args: '1'}
    ]
  }
];

module.exports = {type: T, method: M, schema: Schema, items: resource, menu: menu};
