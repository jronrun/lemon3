'use strict';

var gutil = require("gulp-util"),
  webpack = require("webpack"),
  webpackConfig = require("../../config/webpack.config.js");

module.exports.task = function (gulp, plugins, config, callback) {
  // modify some webpack config options
  var myConfig = Object.create(webpackConfig);
  myConfig.plugins = myConfig.plugins.concat(
    new webpack.DefinePlugin({
      "process.env": {
        "NODE_ENV": JSON.stringify("production")
      }
    }),
    new webpack.optimize.DedupePlugin(),
    new webpack.optimize.UglifyJsPlugin({
      compress: {
        warnings: false
      },
      output: {
        comments: false
      }
    })
  );

  // run webpack
  webpack(myConfig, function (err, stats) {
    if (err) {
      throw new gutil.PluginError("webpack:build", err);
    }

    gutil.log("[webpack:build]", stats.toString({
      colors: true
    }));

    callback();
  });
};
