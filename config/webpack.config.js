'use strict';

var path = require("path");
var webpack = require("webpack");
var glob = require('glob'),
  root = path.join(__dirname, "../public/components");

function entries (globPath) {
  var files = glob.sync(globPath);
  var entries = {}, entry, dirname, basename;

  for (var i = 0; i < files.length; i++) {
    entry = files[i];
    dirname = path.dirname(entry);
    basename = path.basename(entry, '.js');
    var index = path.join(dirname, basename);
    index = index.replace('public/entry/manage', 'manage');
    index = index.replace('public/entry/', '');

    entries[index] = './' + entry;
    if (['index', 'boot'].indexOf(index) != -1) {
      entries[index] = [entries[index], 'bootstrap-loader'];
    }

    else if (['style'].indexOf(index) != -1) {
      entries[index] = [entries[index], 'bootstrap/dist/css/bootstrap.css'];
    }
  }

  console.log(entries);
  return entries;
}

function bowerdir(target) {
  return root + target;
}

module.exports = {
  cache: true,
  debug: true,
  entry: entries('public/entry/**/*.js'),
  /*
   entry: {
   index: ['./public/entry/index.js', 'bootstrap-loader'],
   notebook: './public/entry/notebook.js',
   theme: './public/entry/theme.js',
   manage: './public/entry/manage/index.js'
   },
   */
  output: {
    path: path.join(__dirname, "../public/dist"),
    publicPath: "./public/dist/",
    filename: "[name].js",
    chunkFilename: "[chunkhash].js"
  },
  module: {
    loaders: [
      {test: /\.css$/, loader: "style-loader!css-loader"},
      {test: /\.png$/, loader: "url-loader?limit=100000"},
      {test: /\.jpg$/, loader: "file-loader"},
      {test: /\.styl$/, loader: 'style-loader!css-loader!stylus-loader'},
      {test: /\.coffee$/, loader: "coffee-loader"},

      {test: /bootstrap\/dist\/js\/umd\//, loader: 'imports?jQuery=jquery'},
      {test: /\.scss$/, loaders: ['style', 'css', 'sass']},
      {test: /\.(png|woff|woff2|eot|ttf|svg|gif)(\?v=[0-9]\.[0-9]\.[0-9])?$/, loader: 'url-loader?limit=100000'}
    ]
  },
  externals: {},
  resolve: {
    root: [ root ],
    alias: {
      htmlhint: bowerdir('/codemirror/addon/hint/html-hint.js')
    }
  },
  plugins: [
    new webpack.ResolverPlugin(
      new webpack.ResolverPlugin.DirectoryDescriptionFilePlugin(".bower.json", ["main"])
    ),
    new webpack.ProvidePlugin({
      $: 'jquery',
      jQuery: 'jquery',
      "window.jQuery": 'jquery',
      Tether: "tether",
      "window.Tether": "tether",
      Tooltip: "exports?Tooltip!bootstrap/js/dist/tooltip",
      Alert: "exports?Alert!bootstrap/js/dist/alert",
      Button: "exports?Button!bootstrap/js/dist/button",
      Carousel: "exports?Carousel!bootstrap/js/dist/carousel",
      Collapse: "exports?Collapse!bootstrap/js/dist/collapse",
      Dropdown: "exports?Dropdown!bootstrap/js/dist/dropdown",
      Modal: "exports?Modal!bootstrap/js/dist/modal",
      Popover: "exports?Popover!bootstrap/js/dist/popover",
      Scrollspy: "exports?Scrollspy!bootstrap/js/dist/scrollspy",
      Tab: "exports?Tab!bootstrap/js/dist/tab",
      Util: "exports?Util!bootstrap/js/dist/util",
    }),
    new webpack.DefinePlugin({
      VERSION: JSON.stringify("5fa3b9")
    })

  ]
};
