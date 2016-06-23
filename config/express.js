'use strict';

var express = require('express'),
  session = require('express-session'),
  expressValidator = require('express-validator'),
  glob = require('glob');

var favicon = require('serve-favicon'),
  morgan = require('morgan'),
  cookieParser = require('cookie-parser'),
  //cookieSession = require('cookie-session'),
  bodyParser = require('body-parser'),
  compression = require('compression'),
  methodOverride = require('method-override'),
  mongoStore = require('connect-mongo')(session),
  flash = require('connect-flash'),
  multer = require('multer');

var hbs = require('hbs'),
  registrar = app_require('coms/helpers/registrar'),
  log = log_from('express');

var User = app_require('models/user');
var authWarnMsg = 'you do not have permission to access the requested resource.';

module.exports = function(app, config, passport) {
  var env = process.env.NODE_ENV || 'development';
  var secret = config.app.name + 'kfvahtmgt';
  app.locals.ENV = env;
  app.locals.ENV_DEVELOPMENT = env == 'development';
  app.locals.pkg = config.pkg;
  app.locals.title = config.app.name;
  app.locals.app_name = config.app.name;

  app.use(compression({
    threshold: 512
  }));

  registrar.register(hbs.handlebars);
  hbs.registerPartials(config.root + '/app/views/partials');

  app.use(express.static(config.root + '/public'));

  //app.set('view options', {layout: 'partials/layout'});
  app.set('views', config.root + '/app/views');
  app.set('view engine', 'html');
  app.engine('html', hbs.__express);

  // app.use(favicon(config.root + '/public/img/favicon.ico'));
  app.use(morgan(config.morganFmt));

  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(expressValidator({}));
  app.use(multer().array('image', 1));
  app.use(methodOverride(function (req) {
    if (req.body && typeof req.body === 'object' && '_method' in req.body) {
      // look in urlencoded POST bodies and delete it
      var method = req.body._method;
      delete req.body._method;
      return method;
    }
  }));

  app.use(cookieParser());
  //app.use(cookieSession({ secret: secret }));
  app.use(session({
    resave: true,
    saveUninitialized: true,
    secret: secret,
    store: new mongoStore({
      url: config.db,
      collection : 'sessions'
    })
  }));

  // use passport session
  app.use(passport.initialize());
  app.use(passport.session());

  // connect flash for flash messages - should be declared after sessions
  app.use(flash());

  app.use(function (req, res, next) {
    req.isMobile = /mobile/i.test(req.header('user-agent'));
    req.requri = req.baseUrl + req.path;
    req.resource = getResource(req.requri, req.method);
    req.isManage = _.startsWith(req.resource.action, '/manage');
    req.isGet = HttpMethod.GET == req.resource.method;
    req.isAjax = !_.isUndefined(req.header('X-Requested-With'));
    req.isPjax = !_.isUndefined(req.headers['x-pjax']);
    req.reference = req.headers['referer-source'] || '';

    res.info = function(msg, source, options, fn) {
      req.flash('info', msg);
      if (source) {
        return res.render(source, options, fn)
      }
    };
    res.err = function(msg, source, options, fn) {
      req.flash('errors', msg);
      if (source) {
        return res.render(source, options, fn)
      }
    };
    res.succ = function(msg, source, options, fn) {
      req.flash('success', msg);
      if (source) {
        return res.render(source, options, fn)
      }
    };
    res.warn = function(msg, source, options, fn) {
      req.flash('warning', msg);
      if (source) {
        return res.render(source, options, fn)
      }
    };

    next();
  });

  app.use(function (req, res, next) {
    if (req.resource.protect) {
      if (!req.isAuthenticated()) {
        req.session.returnTo = req.isGet ? req.originalUrl : routes.home.action;
        res.redirect(routes.user.signin.action);
        return;
      }

      req.anonymous = false;
      if (req.user.isAdmin) {
        next();
        return;
      }

      //has power
      if (req.user.resource.indexOf(req.resource.id) != -1) {
        next();
        return;
      }
      //no power
      else {
        var err = Error(authWarnMsg);
        err.status = 401;

        if (req.isAjax) {
          if (req.isPjax) {
            next(err);
            return;
          }

          return res.json(answer.fail(authWarnMsg));
        } else {
          next(err);
          return;
        }
      }
    }

    req.anonymous = !req.isAuthenticated();
    next();
  });

  app.use(function (req, res, next) {
    var _render = res.render;
    res.render = function (source, options, fn) {
      var view = '', options = options || {};
      if (_.isString(source)) {
        view = source;
      } else {
        view = source.page;
        options = _.extend({
          title: source.desc,
          action: source.action
        }, options);
      }

      if (req.isPjax) {
        options.layout = false;
      } else if (req.isManage) {
        _.extend(options, {
          layout: (req.isGet ? 'manage/layout' : (options.layout || false))
        });
        if (req.isGet) {
          _.extend(options, {
            username: req.user.name,
            menus: getUserMenu(req.user.resource, req.user.isAdmin)
          });
        }
      }

      _.extend(options, req.flash(), {
        source: req.resource.id,
        reference: req.reference
      });
      if (app.locals.ENV_DEVELOPMENT) {
        log.debug('render source ' + (req.resource.id || req.originalUrl) + ' with ' + view, options);
        _.extend(options, {
          livereload: config.livereload
        });
      }

      _render.call(this, view, options, fn);
    };

    next();
  });

  var controllerRoot = config.root + '/app/controllers/';
  var controllers = glob.sync(controllerRoot + '**/*.js', {
    ignore: controllerRoot + 'manage/inherit/**/*.js'
  });
  controllers.forEach(function (controller) {
    require(controller)(app, passport);
  });

  app.use(function (req, res, next) {
    var err = Error('Not Found');
    err.status = 404;
    next(err);
  });

  app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.render(req.isManage ? 'manage/error' : 'error', {
      message: err.message, error: err, status: err.status || 500
    });
  });

};
