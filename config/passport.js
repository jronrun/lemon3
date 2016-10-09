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
      user.isAdmin = isAdminUser(user);

      User.getResource(user.id).then(function (userResource) {
        user.resource = userResource.resource;
        user.env = userResource.env;
        user.group = userResource.group;
        user.server = userResource.server;
        user.interface = userResource.interface;
        user.innerPowers = userResource.innerPowers;

        done(err, user);
      });
    });
  });

  passport.use(local);
};

