'use strict';

var Role = app_require('models/role'),
  Power = app_require('models/power'),
  log = log_from('roles');

module.exports = function (router, index, root) {

  var generic = app_require('helpers/generic')(Role, index, {
    element: {
      desc: {
        label: 'Description'
      }
    }
  });

  /**
   * Role list
   */
  router.get(index.do, function (req, res, next) {
    Power.find({}).sort({_id: -1}).toArray(function (err, items) {
      var powerData = {};

      _.each(items, function (item) {
        powerData[item.id] = item;
      });

      var defines = [
        {
          title: 'Name',
          prop: function(item) {
            return generic.title(item.name, getAction(root.roles.retrieve, item._id));
          },
          clazz: 'fixed pull-left item-col-title'
        },
        {
          title: 'Description',
          prop: 'desc',
          clazz: 'item-col-author'
        },
        {
          title: 'Power',
          prop: function(item) {
            var powerName = [];
            _.each(item.powers, function (powerId) {
              var aPower = powerData[powerId], aType = '';
              if (1 == aPower.type) {
                aType = generic.label('URL');
              } else if (2 == aPower.type) {
                aType = generic.label('API');
              }
              if (aPower) {
                powerName.push(generic.info(getAction(root.powers.retrieve, aPower._id), aPower.name) + aType);
              }
            });
            return powerName.join('</br>');
          },
          clazz: 'item-col-author'
        },
        {
          title: 'Create',
          prop: 'create_time',
          clazz: 'item-col-date',
          type: 'date'
        }
      ];

      var search = [
        generic.searchInput('name', 'search role...')
      ];

      generic.list({
        defines: defines,
        search: search
      }, req, res, next);
    });

  });

  /**
   * Role editor
   */
  router.get(index.editor.do, function (req, res, next) {
    Power.find({}).sort({_id: -1}).toArray(function (err, items) {
      var powerData = [];

      _.each(items, function (item) {
        powerData.push({
          tip: item.name,
          val: item.id,
          selected: 0,
          desc: generic.info(getAction(root.powers.retrieve, item._id))
        });
      });

      generic.editor({
        schemaExclude: ['resources', 'powers'],
        formElHandle: function(form) {
          form.push(generic.checkboxEl('powers', {
            options: powerData
          }));
        }
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
      }
    }, req, res, next);
  });

  /**
   * Role update
   */
  router.put(index.retrieve.do, function (req, res, next) {
    userReourceCacheReset();
    generic.update({
      checkExistsField: 'name',
      resourceUpdate: 1,
      resourceTab: 2,
      paramHandle: function(item) {
        if (item.resources) {
          delete item.resources;
        }
      }
    }, req, res, next);
  });

  /**
   * Role retrieve
   */
  router.get(index.retrieve.do, function (req, res, next) {
    var roleId = req.params.id;
    Power.find({}).sort({_id: -1}).toArray(function (err, items) {
      var powerData = [];

      Role.findById(roleId, function(err, doc) {
        var thePowers = doc.powers || [];

        _.each(items, function (item) {
          powerData.push({
            tip: item.name,
            val: item.id,
            selected: thePowers.indexOf(String(item.id)) != -1 ? 1 : 0,
            desc: generic.info(getAction(root.powers.retrieve, item._id))
          });
        });

        generic.retrieve({
          schemaExclude: ['resources', 'powers'],
          formElHandle: function(form) {
            form.push(generic.checkboxEl('powers', {
              options: powerData
            }));
          },
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
    generic.delete({}, req, res, next);
  });

};

