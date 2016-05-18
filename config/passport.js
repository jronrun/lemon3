'use strict';

var User = app_require('models/user'),
  local = require('./passport/local');

module.exports = function (passport) {

  passport.serializeUser(function(user, done) {
    done(null, user._id);
  });

  passport.deserializeUser(function(id, done) {
    User.findById(id, function (err, user) {
      if (!user || 0 !== user.state) {
        return done(Error('Account has issues ' + id));
      }

      delete user.passwd;
      user.id = user._id.toString();
      user.isAdmin = (user.roles || []).indexOf(ADMIN_ROLE) != -1;

      User.getResource(user.id).then(function (userResource) {
        user.resource = userResource;
        done(err, user);
      });
    });
  });

  passport.use(local);
};

