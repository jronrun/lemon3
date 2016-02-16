var path = require("path");
var webpack = require("webpack");
var autoprefixer = require('autoprefixer');

module.exports = {
  cache: true,
  debug: true,
  entry: {
    index: ["./public/entry/index.js", 'bootstrap-loader']
  },
  output: {
    path: path.join(__dirname, "public/dist"),
    publicPath: "public/dist/",
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
      //{ test: /\.css$/, loaders: [ 'style', 'css', 'postcss' ] },
      {test: /\.scss$/, loaders: ['style', 'css', 'postcss', 'sass']},
      {test: /\.(png|woff|woff2|eot|ttf|svg)(\?v=[0-9]\.[0-9]\.[0-9])?$/, loader: 'url-loader?limit=100000'}
    ]
  },
  postcss: [autoprefixer],
  externals: {},
  resolve: {
    root: [path.join(__dirname, "public/components")],
    alias: {}
  },
  plugins: [
    new webpack.ResolverPlugin(
      new webpack.ResolverPlugin.DirectoryDescriptionFilePlugin(".bower.json", ["main"])
    ),
    new webpack.ProvidePlugin({
      $: 'jquery',
      jQuery: 'jquery',
      "window.jQuery": 'jquery'
    }),
    new webpack.DefinePlugin({
      VERSION: JSON.stringify("5fa3b9")
    })

  ]
};
