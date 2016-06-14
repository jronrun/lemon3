'use strict';

var log = log_from('sourcetree'),
  User = app_require('models/user'),
  Power = app_require('models/power'),
  Role = app_require('models/role');

module.exports = function (router, index, root) {
  /**
   * Whole resource tree
   */
  router.post(index.do, function (req, res, next) {
    res.render(index, {
      nodes: getResourceTree()
    })
  });

  /**
   * Power resource tree
   */
  router.post(index.power.do, function (req, res, next) {
    Power.findById(req.params.id, function (err, result) {
      if (err) {
        return res.json(answer.fail(err.message));
      }

      if (!result) {
        return res.json(answer.fail('item not exists.'));
      }

      res.render(index, {
        nodes: getResourceTree(result.resources)
      });
    });
  });

  /**
   * Role resource tree
   */
  router.post(index.role.do, function (req, res, next) {
    Role.findById(req.params.id, function (err, result) {
      if (err) {
        return res.json(answer.fail(err.message));
      }

      if (!result) {
        return res.json(answer.fail('item not exists.'));
      }

      var thePowers = [];
      _.each(result.powers || [], function (aPower) {
        thePowers.push(parseInt(aPower));
      });

      Power.find({id: {$in: thePowers}}).toArray(function (error, items) {
        if (error) {
          return res.json(answer.fail(error.message));
        }

        var theResources = [];
        _.each(items || [], function (item) {
          _.each(item.resources, function (aSource) {
            theResources.push(parseInt(aSource));
          });
        });

        res.render(index, {
          nodes: getResourceTree(theResources)
        });
      });

    });
  });

  /**
   * User resource tree
   */
  router.post(index.user.do, function (req, res, next) {
    User.loadResource(req.params.id).then(function (userResource) {
      res.render(index, {
        nodes: getResourceTree(userResource.resource)
      });
    });
  });
};

