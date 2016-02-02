var gulp = require('gulp'),
  gutil = require("gulp-util"),
  nodemon = require('gulp-nodemon'),
  plumber = require('gulp-plumber'),
  livereload = require('gulp-livereload'),
  stylus = require('gulp-stylus');

var webpack = require("webpack");
var WebpackDevServer = require("webpack-dev-server");
var webpackConfig = require("./webpack.config.js");

gulp.task('stylus', function () {
  gulp.src('./public/css/*.styl')
    .pipe(plumber())
    .pipe(stylus())
    .pipe(gulp.dest('./public/css'))
    .pipe(livereload());
});

gulp.task('watch:stylus', function() {
  gulp.watch('./public/css/*.styl', ['stylus']);
});

gulp.task('develop', function () {
  livereload.listen();
  nodemon({
    script: 'app.js',
    ext: 'coffee jade',
    stdout: false
  }).on('readable', function () {
    this.stdout.on('data', function (chunk) {
      if(/^Express server listening on port/.test(chunk)){
        livereload.changed(__dirname);
      }
    });
    this.stdout.pipe(process.stdout);
    this.stderr.pipe(process.stderr);
  });
});

gulp.task("webpack:build", function(callback) {
  // modify some webpack config options
  var myConfig = Object.create(webpackConfig);
  myConfig.plugins = myConfig.plugins.concat(
    new webpack.DefinePlugin({
      "process.env": {
        // This has effect on the react lib size
        "NODE_ENV": JSON.stringify("production")
      }
    }),
    new webpack.optimize.DedupePlugin(),
    new webpack.optimize.UglifyJsPlugin()
  );

  // run webpack
  webpack(myConfig, function(err, stats) {
    if(err) {
      throw new gutil.PluginError("webpack:build", err);
    }

    gutil.log("[webpack:build]", stats.toString({
      colors: true
    }));

    callback();
  });
});

// Webpack Production build
gulp.task("build", ["webpack:build"]);

// this & 'gulp webpack' || this & 'npm run dev'
gulp.task('default', [
  //'stylus',
  'develop',
  //'watch:stylus'
]);

//this & 'gulp' || this & 'npm start'
gulp.task("webpack", ["webpack:dev-server"]);

gulp.task('webpack:dev-server', function () {
  var devServerConfig = Object.create(webpackConfig)
  // webpack need this to send request to webpack-dev-server
  devServerConfig.plugins = devServerConfig.plugins || []
  devServerConfig.plugins.push(new webpack.HotModuleReplacementPlugin())
  devServerConfig.devtool = "sourcemap";
  devServerConfig.debug = true;

  // inline mode
  devServerConfig.entry.index.unshift('webpack-dev-server/client?http://localhost:8080', 'webpack/hot/dev-server')

  var compiler = webpack(devServerConfig)
  new WebpackDevServer(compiler, {
    // contentBase: {target: 'http://localhost:3000/'},
    // Set this as true if you want to access dev server from arbitrary url.
    // This is handy if you are using a html5 router.
    historyApiFallback: false,
    proxy: {
      '*': 'http://localhost:3000'
    },
    publicPath: '/dist/',
    lazy: false,
    hot: false
  }).listen(8080, 'localhost', function (err) {
    if (err) {
      throw new gutil.PluginError('webpack-dev-server', err)
    }

    gutil.log('[webpack-dev-server]', 'http://localhost:8080/')
  })
})

