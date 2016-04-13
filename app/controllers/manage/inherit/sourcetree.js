'use strict';

var log = log_from('sourcetree');

module.exports = function (router, index) {
  /**
   * Whole resource tree
   */
  router.post(index.resource.do, function (req, res, next) {
    res.render(index.resource, {
      nodes: getResourceTree()
    })
  });

  /**
   * Power resource tree
   */
  router.post(index.resource.power.do, function (req, res, next) {

  });

  /**
   * Role resource tree
   */
  router.post(index.resource.role.do, function (req, res, next) {

  });

  /**
   * User resource tree
   */
  router.post(index.resource.user.do, function (req, res, next) {

  });
};

