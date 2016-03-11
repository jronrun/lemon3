'use strict';

var express = require('express'),
  config = require('./config/config'),
  passport = require('passport');

var app = express();

require('./app/coms/comm')(global, config);
require('./config/passport')(passport);
require('./config/express')(app, config);

app.listen(config.port, function () {
  console.log('Express server listening on port ' + config.port);
});

