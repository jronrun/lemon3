var express = require('express');
var session = require('express-session');
var expressValidator = require('express-validator');
var glob = require('glob');

var favicon = require('serve-favicon');
var morgan = require('morgan');
var cookieParser = require('cookie-parser');
var cookieSession = require('cookie-session');
var bodyParser = require('body-parser');
var compression = require('compression');
var methodOverride = require('method-override');
var mongoStore = require('connect-mongo')(session);
var passport = require('passport');
var multer = require('multer');
var hbs = require('hbs');
var hbsregist = app_require('coms/helpers/hbsregist');

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

  app.set('view options', {layout: false});
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

  app.use(function (req, res, next) {
    //getResource(req.path, req.method)

    next();
  });

  app.use(function (req, res, next) {
    var _render = res.render, isMobile = /mobile/i.test(req.header('user-agent'));

    res.render = function (view, options, fn) {
      if (app.locals.ENV_DEVELOPMENT) {
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
