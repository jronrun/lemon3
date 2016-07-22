'use strict';

var Interface = app_require('models/api/interf'),
  Group = app_require('models/api/group'),
  log = log_from('interfs');

var MUTATION = 2;

module.exports = function (router, index, root) {

  var generic = app_require('helpers/generic')(Interface, index, {
    element: {
      desc: {
        label: 'Description'
      }
    }
  });

  /**
   * Interface list
   */
  router.get(index.do, function (req, res, next) {
    Group.find(generic.groupOwnerQuery(req)).sort({_id: -1}).toArray(function (err, items) {
      var groupData = {};
      items = _.orderBy(items, ['order', 'id'], ['asc', 'desc']);
      _.each(items, function (item) {
        groupData[item.id] = item;
      });

      var defines = [
        {
          title: 'Name',
          prop: function(item) {
            return generic.title(item.name, getAction(root.interface.retrieve, item._id), item.id);
          },
          clazz: 'fixed pull-left item-col-title'
        },
        {
          title: 'Description',
          prop: function(item) {
            var descs = [];
            if (MUTATION == item.mutation) {
              descs.push(generic.label('Mutation of ' + item.name, 'label-success'));
            } else {
              descs.push(generic.label('Define API', 'label-info'));
            }

            descs.push('<small>' + item.desc + '</small>');

            return descs.join('<br/>');
          },
          clazz: 'item-col-author'
        },
        {
          title: 'Group',
          prop: function(item) {
            var aGroup = groupData[item.group_id];
            if (!aGroup) {
              return generic.ownerPrivate();
            }
            return generic.info(getAction(root.group.retrieve, aGroup._id), aGroup.name);
          },
          clazz: 'item-col-author'
        },
        {
          title: 'Owner',
          prop: function(item) {
            switch (parseInt(item.owner)) {
              case 1:
                return generic.ownerPublic();
              case 2:
                return generic.ownerPrivate();
            }
          },
          clazz: 'item-col-author'
        },
        {
          title: 'Create By',
          prop: function(item) {
            var aUser = item.create_by;
            return generic.info(getAction(root.users.retrieve, aUser.id), aUser.name);
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
        generic.searchInput('id', 'search id...'),
        generic.searchInput('name', 'search interface...')
      ];

      generic.list({
        ownerQuery: 1,
        defines: defines,
        search: search,
        queryHandle: function(realQuery, query) {
          if (realQuery.name) {
            var likeKey = realQuery.name;
            _.extend(realQuery, {
              $or:[
                { name: likeKey},
                { desc: likeKey}
              ]
            });

            delete realQuery.name;
          }
        }
      }, req, res, next);
    });
  });

  /**
   * Interface editor
   */
  router.get(index.editor.do, function (req, res, next) {
    Group.find(generic.groupOwnerQuery(req)).sort({_id: -1}).toArray(function (err, items) {
      var groupData = [];
      items = _.orderBy(items, ['order', 'id'], ['asc', 'desc']);
      _.each(items, function (item) {
        groupData.push({
          tip: item.name,
          val: item.id,
          selected: 0,
          desc: generic.info(getAction(root.group.retrieve, item._id))
        });
      });

      var requestEl = generic.codemirrorEl('request', {
        label: '',
        attrs: {
          required: 'required'
        }
      });
      var responseEl = generic.codemirrorEl('response', {
        label: ''
      });

      generic.editor({
        schemaExclude: [
          'create_by', 'group_id', 'request_doc', 'response_doc',
          'group_order', 'mutation', 'mutation_host'
        ],
        modelName: 'interface',
        defineElement: {
          owner: {
            selected: 1,
            el: 'radio',
            inline: 1
          }
        },
        tabs: [
          {
            tabName: 'Request',
            form: generic.formEl(requestEl)
          },
          {
            tabName: 'Response',
            form: generic.formEl(responseEl)
          }
        ],
        formElHandle: function(form) {
          var theGroup = generic.selectEl('group_id', {
            label: 'Group',
            options: groupData
          });

          form.afterEl('desc', theGroup);
        }
      }, req, res, next);
    });
  });

  function createAPI(options, req, res, next) {
    var createOptions = {
      sequenceId: 1,
      paramHandle: function(item) {
        if (MUTATION == options.mutation) {
          item.mutation_host = options.mutation_host
        }

        item.mutation = options.mutation;
        item.owner = parseInt(item.owner);
        item.group_id = parseInt(item.group_id);
        item.create_by = {
          id: req.user.id,
          name: req.user.name
        };
        item.group_order = DEFAULT_ORDER;

        item.request_doc = req.body.request;
        var dec = crypto.decompress(req.body.request);
        try {
          item.request = json5s.parse(dec);
        } catch(e) {
          res.json(answer.fail('Request is not a valid JSON'));
          return generic.BREAK;
        }

        if (req.body.response) {
          item.response_doc = req.body.response;
          var dec = crypto.decompress(req.body.response);
          try {
            item.response = json5s.parse(dec);
          } catch(e) {
            res.json(answer.fail('Response is not a valid JSON'));
            return generic.BREAK;
          }
        } else {
          item.response = {};
        }
      },
      beforeCreateHandle: function(item, callback) {
        Group.find({id: item.group_id}).limit(1).next(function(err, group) {
          item.group_order = group.order;
          callback(null, item);
        });
      }
    };

    if (MUTATION != options.mutation) {
      createOptions.checkExistsField = ['name', 'mutation'];
    }

    generic.create(createOptions, req, res, next);
  }

  /**
   * Interface create
   */
  router.post(index.editor.do, function (req, res, next) {
    createAPI({
      mutation: 1
    }, req, res, next);
  });

  /**
   * Interface update
   */
  router.put(index.retrieve.do, function (req, res, next) {
    generic.update({
      checkExistsField: ['name', 'mutation'],
      paramHandle: function(item, theOptions) {
        item.mutation = parseInt(item.mutation);
        if (MUTATION == item.mutation) {
          //new mutation
          if ('1' != item.mutation_update) {
            Interface.findById(req.params.id, function (err, aResult) {
              if (err) {
                return res.json(answer.fail(err.message));
              }

              if (!aResult) {
                return res.json(answer.fail('mutation host not exists.'));
              }

              if (item.name != aResult.name) {
                return res.json(answer.fail('mutation interface name must equal host interface name: ' + aResult.name));
              }

              createAPI({
                mutation: MUTATION,
                mutation_host: aResult.id
              }, req, res, next);
            });

            return generic.BREAK;
          }
          //update mutation
          else {
            theOptions.checkExistsField = false;
          }
        }

        item.owner = parseInt(item.owner);
        item.group_id = parseInt(item.group_id);
        item.create_by = {
          id: req.user.id,
          name: req.user.name
        };
        item.group_order = DEFAULT_ORDER;

        item.request_doc = req.body.request;
        var dec = crypto.decompress(req.body.request);
        try {
          item.request = json5s.parse(dec);
        } catch(e) {
          res.json(answer.fail('Request is not a valid JSON'));
          return generic.BREAK;
        }

        if (req.body.response) {
          item.response_doc = req.body.response;
          var dec = crypto.decompress(req.body.response);
          try {
            item.response = json5s.parse(dec);
          } catch(e) {
            res.json(answer.fail('Response is not a valid JSON'));
            return generic.BREAK;
          }
        } else {
          item.response = {};
        }
      },
      beforeUpdateHandle: function(target, itemObj, callback) {
        Group.find({id: itemObj.group_id}).limit(1).next(function(err, group) {
          target.group_order = group.order;
          callback(null, target, itemObj);
        });
      }
    }, req, res, next);
  });

  /**
   * Interface retrieve
   */
  router.get(index.retrieve.do, function (req, res, next) {
    Group.find(generic.groupOwnerQuery(req)).sort({_id: -1}).toArray(function (err, items) {
      var groupData = [];
      _.each(items, function (item) {
        groupData.push({
          tip: item.name,
          val: item.id,
          selected: 0,
          desc: generic.info(getAction(root.group.retrieve, item._id))
        });
      });

      var requestEl = generic.codemirrorEl('request', {
        label: '',
        attrs: {
          required: 'required'
        }
      });
      var responseEl = generic.codemirrorEl('response', {
        label: ''
      });

      generic.retrieve({
        schemaExclude: [
          'create_by', 'group_id', 'request_doc', 'mutation_host',
          'response_doc', 'request', 'response', 'group_order'
        ],
        modelName: 'interface',
        defineElement: {
          owner: {
            el: 'radio',
            inline: 1
          }
        },
        tabs: [
          {
            tabName: 'Request',
            form: generic.formEl(requestEl)
          },
          {
            tabName: 'Response',
            form: generic.formEl(responseEl)
          }
        ],
        formElHandle: function(form) {
          var theGroup = generic.selectEl('group_id', {
            label: 'Group',
            options: groupData
          });

          form.afterEl('desc', theGroup);

          if (MUTATION == form.item.mutation) {
            var mutationEl = form.get('mutation');
            mutationEl.attrs.disabled = "disabled";

            var nameEl = form.get('name');
            nameEl.attrs.disabled = "disabled";
            nameEl.attrs.readonly = "readonly";

            var theUpdateMark = generic.inputEl('mutation_update', 'hidden', {
              label: '',
              value: 1
            });
            form.afterEl('mutation', theUpdateMark);
          }
        },
        resultHandle: function(item, respdata) {
          respdata.group_id = item.group_id;
        },
        additionHandle: function(item, addition) {
          addition.request = item.request_doc;
          if (item.response_doc) {
            addition.response = item.response_doc;
          }
        }
      }, req, res, next);
    });
  });

  /**
   * Interface delete
   */
  router.delete(index.retrieve.do, function (req, res, next) {
    generic.delete({}, req, res, next);
  });

};

