'use strict';

var User = app_require('models/user'),
  LocalStrategy = require('passport-local').Strategy;

module.exports = new LocalStrategy(
  function (username, password, done) {

    User.find({email: username}).limit(1).next(function(err, user){
      if (err) {
        return done(err);
      }
      if (!user) {
        return done(null, false);
      }

      if (user.passwd != crypto.encrypt(password)) {
        return done(null, false);
      }

      return done(null, user);
    });

  }
);
