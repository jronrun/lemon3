'use strict';

/**
 * 1. export LEMON3_HOST="localhost"
 *    export MONGOHQ_URL="mongodb://{usr}:{passwd}@localhost:27017/{db}"
 * 2. gulp, gulp webpack
 * 3. npm run debug, npm run debugtool, gulp webpack
 *
 * @type {Gulp|*|exports|module.exports}
 */
var gulp 	= require('gulp'),
  plugins = require('gulp-load-plugins')(),
  config = require('./config/config'),
  loader = require('./build/loader');

loader.loadTasks(gulp, plugins, config);

// this & 'gulp webpack' || this & 'npm run dev'
gulp.task('default', ['serv-develop']);

//this & 'gulp' || this & 'npm start'
gulp.task("webpack", ['serv-webpack']);

//'gulp product'
gulp.task("product", ['serv-product']);
