'use strict';

var Role = app_require('models/role'),
  Power = app_require('models/power'),
  items = app_require('helpers/items'),
  log = log_from('roles');

module.exports = function (router, index, root) {

  var generic = app_require('helpers/generic')(Role, index);

  /**
   * Role list
   */
  router.get(index.do, function (req, res, next) {
    var defines = [
      {
        title: 'Name',
        prop: function(item) {
          var html = [
            '<a href="item-editor.html" class=""><h4 class="item-title">',
              item.name,
            '</h4></a>'
            ];
          return html.join('');
        },
        clazz: 'fixed pull-left item-col-title'
      },
      {
        title: 'Description',
        prop: 'desc',
        clazz: 'item-col-sales'
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

  /**
   * Role editor
   */
  router.get(index.editor.do, function (req, res, next) {
    Power.find({}).sort({_id: -1}).toArray(function (err, items) {
      var roleData = [];

      _.each(items, function (item) {
        roleData.push({
          name: item.name,
          value: item.id,
          selected: 0
        });
      });

      generic.editor({
        schemaExclude: ['resources', 'powers'],
        selectTabs: [{tabName: 'Power', inputName: 'powers', data: roleData }]
      }, req, res, next);
    });
  });

  /**
   * Role create
   */
  router.post(index.editor.do, function (req, res, next) {
    generic.create({
      sequenceId: 1,
      checkExistsField: 'name',
      paramHandle: function(item) {
        item.powers = req.body.powers || [];
      }
    }, req, res, next);
  });

  /**
   * Role update
   */
  router.put(index.retrieve.do, function (req, res, next) {
    generic.update({
      checkExistsField: 'name',
      resourceUpdate: 1,
      resourceTab: 2,
      paramHandle: function(item) {
        item.powers = req.body.powers || [];
      }
    }, req, res, next);
  });

  /**
   * Role retrieve
   */
  router.get(index.retrieve.do, function (req, res, next) {
    var roleId = req.params.id;
    Power.find({}).sort({_id: -1}).toArray(function (err, items) {
      var roleData = [];

      Role.findById(roleId, function(err, doc) {
        var thePowers = doc.powers || [];

        _.each(items, function (item) {
          roleData.push({
            name: item.name,
            value: item.id,
            selected: thePowers.indexOf(String(item.id)) != -1 ? 1 : 0
          });
        });

        generic.retrieve({
          schemaExclude: ['resources', 'powers'],
          selectTabs: [{tabName: 'Power', inputName: 'powers', data: roleData }],
          resourceTab: 2,
          resourceAction: actionWrap(root.resource.role.action, roleId).action
        }, req, res, next);
      });

    });
  });

  /**
   * Role delete
   */
  router.delete(index.retrieve.do, function (req, res, next) {
    generic.delete({
      descField: 'name'
    }, req, res, next);
  });

};

