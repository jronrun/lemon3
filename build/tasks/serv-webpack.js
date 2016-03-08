var util = require('util'),
  gutil = require("gulp-util"),
  webpack = require("webpack"),
  WebpackDevServer = require("webpack-dev-server"),
  webpackConfig = require("../../config/webpack.config.js");

module.exports.task = function (gulp, plugins, config) {
  var devServCfg = Object.create(webpackConfig);
  // webpack need this to send request to webpack-dev-server
  devServCfg.plugins = devServCfg.plugins || [];
  devServCfg.plugins.push(new webpack.HotModuleReplacementPlugin());
  devServCfg.devtool = "source-map";
  devServCfg.debug = true;

  var webpackAddr = util.format('http://%s:%s', config.host, config.webpackPort);
  // inline mode
  devServCfg.entry.index.unshift('webpack-dev-server/client?' + webpackAddr, 'webpack/hot/dev-server');

  var compiler = webpack(devServCfg);
  var appServer = util.format('http://%s:%s', config.host, config.port);

  new WebpackDevServer(compiler, {
    // contentBase: {target: appServer},
    // Set this as true if you want to access dev server from arbitrary url.
    // This is handy if you are using a html5 router.
    historyApiFallback: false,
    proxy: {
      '*': appServer
    },
    publicPath: '/dist/',
    lazy: false,
    hot: false
  }).listen(config.webpackPort, config.host, function (err) {
    if (err) {
      throw new gutil.PluginError('webpack-dev-server', err)
    }

    gutil.log('[webpack-dev-server]', webpackAddr);
  })
};
