var path = require("path");
var webpack = require("webpack");

module.exports = {
  cache: false,
  entry: {
    index: "./public/entry/index.js"
  },
  output: {
    path: path.join(__dirname, "public/dist"),
    publicPath: "public/dist/",
    filename: "[name].js",
    chunkFilename: "[chunkhash].js"
  },
  module: {
    loaders: [
      { test: /\.css$/, loader: "style-loader!css-loader" },
      { test: /\.png$/, loader: "url-loader?limit=100000" },
      { test: /\.jpg$/, loader: "file-loader" },
      { test: /\.styl$/, loader: 'style-loader!css-loader!stylus-loader' }
    ]
  },
  externals: {

  },
  resolve: {
    root: [path.join(__dirname, "public/components")],
    alias: {
    }
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
}
