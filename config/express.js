'use strict';

var express = require('express'),
  session = require('express-session'),
  expressValidator = require('express-validator'),
  glob = require('glob');

var favicon = require('serve-favicon'),
  morgan = require('morgan'),
  cookieParser = require('cookie-parser'),
  cookieSession = require('cookie-session'),
  bodyParser = require('body-parser'),
  compression = require('compression'),
  methodOverride = require('method-override'),
  mongoStore = require('connect-mongo')(session),
  flash = require('connect-flash'),
  passport = require('passport'),
  multer = require('multer');

var hbs = require('hbs'),
  hbsregist = app_require('coms/helpers/hbsregist'),
  log = log_from('express');

module.exports = function(app, config) {
  var env = process.env.NODE_ENV || 'development';
  var secret = config.app.name + 'kfvahtmgt';
  app.locals.ENV = env;
  app.locals.ENV_DEVELOPMENT = env == 'development';
  app.locals.pkg = config.pkg;

  app.use(compression({
    threshold: 512
  }));

  hbsregist.register(hbs.handlebars);
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
  app.use(cookieSession({ secret: secret }));
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

  var controllers = glob.sync(config.root + '/app/controllers/**/*.js');
  controllers.forEach(function (controller) {
    require(controller)(app);
  });

  app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
  });

  if(app.get('env') === 'development'){
    app.use(function (err, req, res, next) {
      res.status(err.status || 500);
      res.render('error', {
        message: err.message,
        error: err,
        title: 'error'
      });
    });
  }

  app.use(function (err, req, res, next) {
    res.status(err.status || 500);
      res.render('error', {
        message: err.message,
        error: {},
        title: 'error'
      });
  });

};
