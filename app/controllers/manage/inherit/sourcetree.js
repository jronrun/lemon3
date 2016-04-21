'use strict';

var log = log_from('sourcetree');

module.exports = function (router, index) {
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

  });

  /**
   * Role resource tree
   */
  router.post(index.role.do, function (req, res, next) {

  });

  /**
   * User resource tree
   */
  router.post(index.user.do, function (req, res, next) {

  });
};

