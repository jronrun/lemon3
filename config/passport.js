'use strict';

var User = app_require('models/user'),
  local = require('./passport/local');

module.exports = function (passport) {

  passport.serializeUser(function(user, done) {
    done(null, user._id);
  });

  passport.deserializeUser(function(id, done) {
    User.findById(id, function (err, user) {
      delete user.passwd;
      user.id = user._id.toString();
      user.roles = user.roles || [];
      user.powers = user.powers || [];
      user.resource = user.resource || [];
      done(err, user);
    });
  });

  passport.use(local);
};

