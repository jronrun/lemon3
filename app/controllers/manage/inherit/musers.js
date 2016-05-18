'use strict';

var User = app_require('models/user'),
  Role = app_require('models/role'),
  log = log_from('musers');

module.exports = function (router, index, root) {

  var generic = app_require('helpers/generic')(User, index);

  /**
   * User list
   */
  router.get(index.do, function (req, res, next) {
    Role.find({}).sort({_id: -1}).toArray(function (err, items) {
      var roleData = {};
      roleData[ADMIN_ROLE] = 'Administrator';

      _.each(items, function (item) {
        roleData[item.id] = item;
      });

      var defines = [
        {
          title: 'Name',
          prop: function(item) {
            return generic.title(item.name, getAction(root.users.retrieve, item._id));
          },
          clazz: 'fixed pull-left item-col-title'
        },
        {
          title: 'Email',
          prop: 'email',
          clazz: 'item-col-author'
        },
        {
          title: 'State',
          clazz: 'item-col-stats',
          prop: function(item) {
            switch (parseInt(item.state)) {
              case 0:
                return 'Normal';
              case 1:
                return 'Frozen';
              case 9:
                return 'Deleted';
            }
          }
        },
        {
          title: 'Role',
          clazz: 'item-col-author',
          prop: function(item) {
            var roleName = [];
            _.each(item.roles, function (roleId) {
              var aRole = roleData[roleId];
              if (aRole) {
                if (ADMIN_ROLE == roleId) {
                  roleName.push('<em class="fa fa-thumbs-up"></em> ' + aRole);
                } else {
                  roleName.push(generic.info(getAction(root.roles.retrieve, aRole._id), aRole.name));
                }
              }
            });
            return roleName.join('</br>');
          }
        },
        {
          title: 'Create',
          prop: 'create_time',
          clazz: 'item-col-date',
          type: 'date'
        }
      ];

      generic.list({
        defines: defines
      }, req, res, next);
    });
  });

  /**
   * User editor
   */
  router.get(index.editor.do, function (req, res, next) {
    Role.find({}).sort({_id: -1}).toArray(function (err, items) {
      var roleData = [];

      _.each(items, function (item) {
        roleData.push({
          name: item.name,
          value: item.id,
          selected: 0,
          desc: generic.info(getAction(root.roles.retrieve, item._id))
        });
      });

      generic.editor({
        schemaExclude: ['roles', 'state'],
        selectTabs: [{tabName: 'Role', inputName: 'roles', data: roleData }]
      }, req, res, next);
    });
  });

  /**
   * User create
   */
  router.post(index.editor.do, function (req, res, next) {
    generic.create({
      checkExistsField: 'name',
      checkExistsField2: 'email',
      paramHandle: function(item) {
        item.roles = req.body.roles || [];
        item.passwd = crypto.encrypt(item.passwd);
        item.state = 0;
      }
    }, req, res, next);
  });

  /**
   * User update
   */
  router.put(index.retrieve.do, function (req, res, next) {
    generic.update({
      checkExistsField: 'name',
      checkExistsField2: 'email',
      resourceUpdate: 1,
      resourceTab: 2,
      paramHandle: function(item) {
        item.roles = req.body.roles || [];
        if (item.resources) {
          delete item.resources;
        }
        //cannot modify email
        if (item.email) {
          delete item.email;
        }
      }
    }, req, res, next);
  });

  /**
   * User retrieve
   */
  router.get(index.retrieve.do, function (req, res, next) {
    var userId = req.params.id;
    Role.find({}).sort({_id: -1}).toArray(function (err, items) {
      var roleData = [];

      User.findById(userId, function(err, doc) {
        var theRoles = doc.roles || [];

        _.each(items, function (item) {
          roleData.push({
            name: item.name,
            value: item.id,
            selected: theRoles.indexOf(String(item.id)) != -1 ? 1 : 0,
            desc: generic.info(getAction(root.roles.retrieve, item._id))
          });
        });

        generic.retrieve({
          schemaExclude: ['passwd', 'roles'],
          selectTabs: [{tabName: 'Role', inputName: 'roles', data: roleData }],
          resourceTab: 2,
          resourceAction: actionWrap(root.resource.user.action, userId).action
        }, req, res, next);
      });

    });
  });

  /**
   * User delete
   */
  router.delete(index.retrieve.do, function (req, res, next) {
    generic.delete({}, req, res, next);
  });

};

