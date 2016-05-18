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
        return done(null, false, {
          message: 'Invalid email or password, Try again?'
        });
      }

      if (user.passwd != crypto.encrypt(password)) {
        return done(null, false, {
          message: 'Invalid email or password, Try again?'
        });
      }

      if (1 === user.state) {
        return done(null, false, {
          message: 'Oops! Your account has been frozen. Please contact us for help.'
        });
      }

      if (9 === user.state) {
        return done(null, false, {
          message: 'Oops! Your account has been permanently disabled.'
        });
      }

      if (0 !== user.state) {
        return done(null, false, {
          message: 'Oops! Your account has issues. Please contact us for help.'
        });
      }

      return done(null, user);
    });

  }
);
