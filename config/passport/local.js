'use strict';

var User = app_require('models/user'),
  LocalStrategy = require('passport-local').Strategy;

module.exports = new LocalStrategy(
  function (username, password, done) {

    User.find({username: username}).limit(1).next(function(err, user){
      if (err) {
        return done(err);
      }
      if (!user) {
        return done(null, false);
      }

      if (user.password != password) {
        return done(null, false);
      }

      return done(null, user);
    });

  }
);
