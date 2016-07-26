'use strict';

/**
 * 1. gulp, gulp webpack
 * 2. npm run debug, npm run debugtool, gulp webpack
 *
 * @type {Gulp|*|exports|module.exports}
 */
var gulp 	= require('gulp'),
  plugins = require('gulp-load-plugins')(),
  config = require('./config/config'),
  loader = require('./build/loader');

loader.loadTasks(gulp, plugins, config);

// this & 'gulp webpack' || this & 'npm run dev'
gulp.task('default', ['build-pickadate', 'build-style', 'serv-develop']);

//this & 'gulp' || this & 'npm start'
gulp.task("webpack", ['serv-webpack']);

//production, export MONGOHQ_URL="mongodb://localhost:27017/lemon3"
gulp.task("production", ['env-product', 'build-pickadate', 'build-style', 'serv-product']);
