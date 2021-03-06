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

  {id: 20, name: 'note', desc: 'Note', protect: false, children: [
      {id: 20001, name: 'entities', desc: 'List', method: M.POST, protect: false},
      {id: 20002, name: 'create', desc: 'Create', method: M.POST, protect: false},
      {id: 20003, name: 'entity', desc: 'Retrieve', action: '/note/entity/:id', protect: false},
      {id: 20004, extend: 20003, desc: 'Update', method: M.PUT, protect: false},
      {id: 20005, extend: 20003, desc: 'Delete', method: M.DELETE, protect: false},

      {id: 20006, name: 'tag', desc: 'Note Tag', method: M.POST, protect: false},
      {id: 20007, name: 'load', desc: 'Share', action: '/note/:id', page: 'note/index', protect: false},
    ]
  },

  {id: 21, name: 'notes', desc: 'Multiple Note', protect: false, page: 'apis/index'},
  {id: 22, name: 'merge', desc: 'Merge', protect: false},
  {id: 23, name: 'merges', desc: 'Multiple Merge', protect: false, page: 'apis/index'},
  {id: 24, name: 'rich', desc: 'Rich Text', protect: false},
  {id: 25, name: 'riches', desc: 'Multiple Rich Text', protect: false, page: 'apis/index'},
  {id: 26, name: 'show', desc: 'Shows', protect: false},
  {id: 27, name: 'eyes', desc: 'Eyes', protect: false},

  {
    id: 30, name: 'user', desc: 'User', children: [
      {id: 30001, name: 'signin', desc: 'Sign In', protect: false},
      {id: 30002, extend: 30001, method: M.POST},

      {id: 30003, name: 'signout', desc: 'Sign Out', protect: false},

      {id: 30004, name: 'signup', method: M.POST, desc: 'Sign Up', protect: false},
      {id: 30005, extend: 30004, method: M.POST}
    ]
  },

  {
    id: 31, name: 'share', desc: 'Create Share', method: M.POST, protect: false, children: [
      {id: 31001, name: 'content', desc: 'Share', action: '/share/:content', page: 'share/index', protect: false},
      {id: 31002, name: 'contents', desc: 'Shares', action: '/share/:content/:title', page: 'share/index', protect: false},
      {id: 31003, name: 'preview', desc: 'Preview', page: 'share/index', protect: false}
    ]
  },

  {
    id: 50, name: 'api', desc: 'Manual API', protect: false, children: [
      {id: 50001, name: 'servers', desc: 'Servers', method: M.POST, protect: false},
      {id: 50002, name: 'interfaces', desc: 'Interfaces', method: M.POST, protect: false},
      {id: 50003, name: 'request', desc: 'Request', method: M.POST, protect: false},
      {
        id: 50004, name: 'history', desc: 'History Fill Response', method: M.POST, protect: false, children: [
          {id: 500041, name: 'next', desc: 'Next History', method: M.POST, protect: false},
          {id: 500042, name: 'prev', desc: 'Previous History', method: M.POST, protect: false},
          {id: 500043, name: 'query', desc: 'History Query', method: M.POST, protect: false},
          {id: 500044, name: 'note', desc: 'History Note', method: M.POST, protect: false}
        ]
      },
      {id: 50005, name: 'define', desc: 'API define', method: M.POST, protect: false},
      {id: 50006, name: 'comment', desc: 'API comment', method: M.POST, protect: false},
      {id: 50007, name: 'viewurl', desc: 'Show API Request URL', method: M.POST, protect: false},
      {id: 50008, name: 'header', desc: 'User Information', method: M.POST, protect: false},
      {id: 50009, name: 'batch', desc: 'Batch Configuration', method: M.POST, protect: false},
      {id: 50010, name: 'settings', desc: 'Get & Set Interface Settings', method: M.POST, protect: false},
      {id: 50011, name: 'definebyid', desc: 'Get API define by ID', method: M.POST, protect: false}
    ]
  },

  {id: 51, name: 'apis', desc: 'Multiple Manual API', protect: false},

  {
    id: 60, name: 'general', desc: 'General', protect: false, children: [
      {id: 60001, name: 'form', desc: 'Form', method: M.POST, protect: false},
      {id: 60002, name: 'convert', desc: 'Data Convert', method: M.POST, protect: false},
      {id: 60003, name: 'convertqs', desc: 'Convert Query String As JSON', method: M.POST, protect: false},
      {id: 60004, name: 'addcomment', desc: 'Add Comment to JSON', method: M.POST, protect: false},
      {id: 60005, name: 'update5', desc: 'Update JSON5', method: M.POST, protect: false}
    ]
  },

  {
    id: 70, name: 'import', desc: 'Import', children: [
      {id: 70002, name: 'analyst', desc: 'Analyst Import Resource', method: M.POST}
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
      },

      {
        id: 200005, name: 'group', desc: 'Group', action: '/manage/groups/:page', page: P.list, children: [
          {id: 2000051, name: 'editor', action: '/manage/group', page: P.edit, desc: 'Editor'},
          {id: 2000052, extend: 2000051, method: M.POST, page: P.list, desc: 'Create'},

          {id: 2000053, name: 'retrieve', action: '/manage/group/:id', page: P.edit, desc: 'Retrieve'},
          {id: 2000054, extend: 2000053, method: M.PUT, page: P.list, desc: 'Update'},
          {id: 2000055, extend: 2000053, method: M.DELETE, page: P.list, desc: 'Delete'}
        ]
      },

      {
        id: 200006, name: 'interface', desc: 'Interface', action: '/manage/interfaces/:page', page: P.list, children: [
          {id: 2000061, name: 'editor', action: '/manage/interface', page: P.edit, desc: 'Editor'},
          {id: 2000062, extend: 2000061, method: M.POST, page: P.list, desc: 'Create'},

          {id: 2000063, name: 'retrieve', action: '/manage/interface/:id', page: P.edit, desc: 'Retrieve'},
          {id: 2000064, extend: 2000063, method: M.PUT, page: P.list, desc: 'Update'},
          {id: 2000065, extend: 2000063, method: M.DELETE, page: P.list, desc: 'Delete'}
        ]
      },

      {
        id: 200007, name: 'server', desc: 'Server', action: '/manage/servers/:page', page: P.list, children: [
          {id: 2000071, name: 'editor', action: '/manage/server', page: P.edit, desc: 'Editor'},
          {id: 2000072, extend: 2000071, method: M.POST, page: P.list, desc: 'Create'},

          {id: 2000073, name: 'retrieve', action: '/manage/server/:id', page: P.edit, desc: 'Retrieve'},
          {id: 2000074, extend: 2000073, method: M.PUT, page: P.list, desc: 'Update'},
          {id: 2000075, extend: 2000073, method: M.DELETE, page: P.list, desc: 'Delete'}
        ]
      },

      {
        id: 200008, name: 'history', desc: 'History', action: '/manage/histories/:page', page: P.list, children: [
          {id: 2000081, name: 'retrieve', action: '/manage/history/:id', page: P.edit, desc: 'Retrieve'}
        ]
      },

      {
        id: 200009, name: 'env', desc: 'Environment', action: '/manage/envs/:page', page: P.list, children: [
          {id: 2000091, name: 'editor', action: '/manage/env', page: P.edit, desc: 'Editor'},
          {id: 2000092, extend: 2000091, method: M.POST, page: P.list, desc: 'Create'},

          {id: 2000093, name: 'retrieve', action: '/manage/env/:id', page: P.edit, desc: 'Retrieve'},
          {id: 2000094, extend: 2000093, method: M.PUT, page: P.list, desc: 'Update'},
          {id: 2000095, extend: 2000093, method: M.DELETE, page: P.list, desc: 'Delete'}
        ]
      },

      {
        id: 200010, name: 'api-power', desc: 'API Powers', action: '/manage/api-powers/:page', page: P.list, children: [
          {id: 2000101, name: 'editor', action: '/manage/api-power', page: P.edit, desc: 'Editor'},
          {id: 2000102, extend: 2000101, method: M.POST, page: P.list, desc: 'Create'},

          {id: 2000103, name: 'retrieve', action: '/manage/api-power/:id', page: P.edit, desc: 'Retrieve'},
          {id: 2000104, extend: 2000103, method: M.PUT, page: P.list, desc: 'Update'},
          {id: 2000105, extend: 2000103, method: M.DELETE, page: P.list, desc: 'Delete'}
        ]
      },

      {
        id: 200011, name: 'share', desc: 'Share', action: '/manage/shares/:page', page: P.list, children: [
          {id: 2000111, name: 'editor', action: '/manage/share', page: P.edit, desc: 'Editor'},
          {id: 2000112, extend: 2000111, method: M.POST, page: P.list, desc: 'Create'},

          {id: 2000113, name: 'retrieve', action: '/manage/share/:id', page: P.edit, desc: 'Retrieve'},
          {id: 2000114, extend: 2000113, method: M.PUT, page: P.list, desc: 'Update'},
          {id: 2000115, extend: 2000113, method: M.DELETE, page: P.list, desc: 'Delete'}
        ]
      },

      { id: 200012, name: 'share-access', desc: 'Share Access', action: '/manage/share-access/:page', page: P.list },

      {
        id: 200013, name: 'tag', desc: 'Tag', action: '/manage/tags/:page', page: P.list, children: [
          {id: 2000131, name: 'editor', action: '/manage/tag', page: P.edit, desc: 'Editor'},
          {id: 2000132, extend: 2000131, method: M.POST, page: P.list, desc: 'Create'},

          {id: 2000133, name: 'retrieve', action: '/manage/tag/:id', page: P.edit, desc: 'Retrieve'},
          {id: 2000134, extend: 2000133, method: M.PUT, page: P.list, desc: 'Update'},
          {id: 2000135, extend: 2000133, method: M.DELETE, page: P.list, desc: 'Delete'}
        ]
      },

      {
        id: 200014, name: 'mnote', desc: 'Note', action: '/manage/notes/:page', page: P.list, children: [
          {id: 2000141, name: 'editor', action: '/manage/note', page: P.edit, desc: 'Editor'},
          {id: 2000142, extend: 2000141, method: M.POST, page: P.list, desc: 'Create'},

          {id: 2000143, name: 'retrieve', action: '/manage/note/:id', page: P.edit, desc: 'Retrieve'},
          {id: 2000144, extend: 2000143, method: M.PUT, page: P.list, desc: 'Update'},
          {id: 2000145, extend: 2000143, method: M.DELETE, page: P.list, desc: 'Delete'}
        ]
      },

      { id: 200015, name: 'initialize', desc: 'Manage', page: 'manage/index'},

      {
        id: 200016, name: 'profile', desc: 'User Profile', children: [
          {id: 2000161, name: 'update', desc: 'Reset User Password', action: '/manage/profile', method: M.POST}
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
      {sourceId: 200003, args: '1'},
      {sourceId: 200011, args: '1'},
      {sourceId: 200014, args: '1'},
      {sourceId: 200013, args: '1'}
    ]
  },
  {
    name: 'Settings', children: [
      {sourceId: 200001, args: '1'},
      {sourceId: 200010, args: '1'},
      {sourceId: 200002, args: '1'}
    ]
  },
  {
    name: 'Manual API', children: [
      {sourceId: 200009, args: '1'},
      {sourceId: 200005, args: '1'},
      {sourceId: 200007, args: '1'},
      {sourceId: 200006, args: '1'}
      //{sourceId: 200008, args: '1'}
    ]
  }

];

module.exports = {type: T, method: M, schema: Schema, items: resource, menu: menu};
