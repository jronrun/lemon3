'use strict';

var express = require('express'),
  router = express.Router(),
  log = log_from('users'),
  User = app_require('models/user'),
  index = routes.user;

module.exports = function (app, passport) {
  app.use(index.action, router);

  router.post(index.signin.do, passport.authenticate('local', {
      failureRedirect: index.signin.action,
      failureFlash: true
      //failureFlash: 'Invalid email or password, Try again?'
    }), function (req, res, next) {

    var redirectTo = req.session.returnTo ? req.session.returnTo : routes.home.action;
    delete req.session.returnTo;
    res.redirect(redirectTo);
  });
};

router.get(index.do, function (req, res, next) {
  res.render(index);
});

router.get(index.signin.do, function (req, res, next) {
  res.render(index.signin, {});
});

router.get(index.signup.do, function (req, res, next) {
  res.render(index.signup);
});

router.post(index.signup.do, function (req, res, next) {
  var aUser = req.body, fill = {
    name: aUser.name,
    email: aUser.email
  };
  if (aUser.retype_passwd !== aUser.passwd) {
    return res.err("These passwords don't match. Try again?", index.signup, fill);
  }

  delete aUser.retype_passwd;
  _.extend(aUser, {
    passwd: crypto.encrypt(aUser.passwd),
    state: 0,
    create_time: new Date()
  });

  var check = User.validate(aUser);
  if (!check.valid) {
    return res.err(check.msg, index.signup, fill);
  }

  async.waterfall([
    function(callback) {
      User.find({email: aUser.email}).limit(1).next(function(err, user){
        callback(null, err, user);
      });
    },
    function(err, user, callback) {
      if (err) {
        return res.err(err.message, index.signup, fill);
      }

      if (user) {
        return res.warn('Someone already has sign up with that email. Try another?', index.signup, fill);
      }

      User.find({name: aUser.name}).limit(1).next(function(err, user){
        callback(null, err, user);
      });
    },
    function(err, user, callback) {
      if (err) {
        return res.err(err.message, index.signup, fill);
      }

      if (user) {
        return res.warn('Someone already has that username. Try another?', index.signup, fill);
      }

      User.insertOne(aUser, function(err, result) {
        if (err) {
          return res.err(err.message, index.signup, fill);
        }

        if (1 != result.insertedCount) {
          return res.err('Sign up fail, Try again?', index.signup, fill);
        }

        callback(null, result);
      });
    }
  ], function (err, result) {
    res.succ('Congratulations! Sign up success!');
    res.redirect(index.signin.action);
  });

});

router.get(index.signout.do, function (req, res, next) {
  req.logout();
  res.redirect(routes.home.action);
});
