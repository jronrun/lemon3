'use strict';

var User = app_require('models/user'),
  Role = app_require('models/role'),
  log = log_from('musers');

module.exports = function (router, index, root) {

  var generic = app_require('helpers/generic')(User, index, {
    form: {

    },
    element: {

    }
  });

  /**
   * User Profile
   */
  router.get(index.profile.do, function (req, res, next) {
    res.render(index.profile);
  });

  /**
   * Update User Profile
   */
  router.post(index.profile.do, function (req, res, next) {

  });

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
                return '<span class="text-success"><em class="fa fa-check"></em> ' + 'Normal</span>';
              case 1:
                return '<span class="text-warning"><em class="fa fa-frown-o"></em> ' + 'Frozen</span>';
              case 9:
                return '<span class="text-muted"><em class="fa fa-remove"></em> ' + 'Deleted</span>';
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
                  roleName.push(generic.em('thumbs-up', aRole));
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

      var search = [
        generic.searchInput('name', 'search user name...'),
        generic.searchInput('email', 'search email...')
      ];

      generic.list({
        defines: defines,
        search: search
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
          tip: item.name,
          val: item.id,
          selected: 0,
          desc: generic.info(getAction(root.roles.retrieve, item._id))
        });
      });

      generic.editor({
        schemaExclude: ['roles', 'state'],
        defineElement: {
          passwd: {
            attrs: {
              type: 'password'
            }
          }
        },
        formElHandle: function(form) {
          form.push(generic.checkboxEl('roles', {
            options: roleData
          }));
        }
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
        item.passwd = crypto.encrypt(item.passwd);
        item.state = 0;
      }
    }, req, res, next);
  });

  /**
   * User update
   */
  router.put(index.retrieve.do, function (req, res, next) {
    userReourceCacheReset();
    generic.update({
      checkExistsField: 'name',
      checkExistsField2: 'email',
      resourceUpdate: 1,
      resourceTab: 2,
      paramHandle: function(item) {
        item.state = parseInt(item.state);
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
      User.findById(userId, function(err, doc) {
        var options = {
          schemaExclude: ['passwd', 'roles'],
          defineElement: {
            email: {
              attrs: {
                readonly: 'readonly'
              }
            }
          }
        };

        if (isAdminUser(doc)) {
          options.defineElement.name = {
            label: generic.em('thumbs-up', 'Administrator Name')
          };
        } else {
          var theRoles = doc.roles || [], roleData = [];

          _.each(items, function (item) {
            roleData.push({
              tip: item.name,
              val: item.id,
              selected: theRoles.indexOf(String(item.id)) != -1 ? 1 : 0,
              desc: generic.info(getAction(root.roles.retrieve, item._id))
            });
          });

          _.extend(options, {
            formElHandle: function(form) {
              form.afterEl('email', generic.checkboxEl('roles', {
                options: roleData
              }));
            },
            resourceTab: 2,
            resourceAction: actionWrap(root.resource.user.action, userId).action
          });
        }

        generic.retrieve(options, req, res, next);
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

