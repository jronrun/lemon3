'use strict';

var User = app_require('models/user'),
  log = log_from('profiles');

module.exports = function (router, index, root) {

  /**
   * User Profile
   */
  router.get(index.do, function (req, res, next) {
    res.render(index, {
      update_action: index.update.action
    });
  });

  /**
   * Update User Profile
   */
  router.post(index.update.do, function (req, res, next) {
    var aProfile = req.body, pType = parseInt(aProfile.profile || '0'), uid = req.user.id,
      updateData = {}, respCall = function (msg, level) {
        res[level || 'err'](msg);
        return res.redirect(index.action);
      };

    switch (pType) {
      //Reset User Password
      case 1:
        if (!aProfile.cur_passwd || aProfile.cur_passwd.length < 1
          || !aProfile.passwd || aProfile.passwd.length < 1) {
          return respCall('These input a valid password.');
        }

        if (aProfile.retype_passwd !== aProfile.passwd) {
          return respCall('These new passwords do not match. Try again?');
        }
        break;
    }


    User.findById(uid, function (err, aUser) {
      if (err) {
        return respCall(err.message);
      }

      switch (pType) {
        //Reset User Password
        case 1:
          if (aUser.passwd !== crypto.encrypt(aProfile.cur_passwd)) {
            return respCall('Current password is not match.');
          }

          updateData = {
            passwd: crypto.encrypt(aProfile.passwd)
          };
          break;
      }

      if (_.isMatch({}, updateData)) {
        return respCall('invalid profile update data.');
      }

      User.updateById(uid, {$set: updateData}, function (errU) {
        if (err) {
          return respCall(errU.message);
        }

        req.session.returnTo = routes.user.signin.action;
        return respCall('Reset password success. <a href="/user/signout">ReLogin!</a>', 'succ');
      });
    });
  });

};

