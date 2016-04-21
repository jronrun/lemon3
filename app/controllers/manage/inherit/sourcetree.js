'use strict';

var log = log_from('sourcetree'),
  Power = app_require('models/power');

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

      res.render(index, {
        nodes: getResourceTree(result.resource)
      });
    });
  });

  /**
   * Role resource tree
   */
  router.post(index.role.do, function (req, res, next) {
    res.render(index, {
      nodes: getResourceTree()
    })
  });

  /**
   * User resource tree
   */
  router.post(index.user.do, function (req, res, next) {
    res.render(index, {
      nodes: getResourceTree()
    })
  });
};

