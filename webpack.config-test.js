var webpack = require("webpack");
var nodeExternals = require("webpack-node-externals");

module.exports = {
  target: "node",
  externals: [nodeExternals()],
  module: {
    preLoaders: [
      { test: /\.js$/, exclude: /node_modules/, loader: "eslint" }
    ],
    loaders: [
      {
        test: /.js$/,
        loader: "babel",
        exclude: /node_modules/,
        query: {
          presets: ["es2015"],
          cacheDirectory: true
        }
      },
      { test: /\.json$/, loader: "json" },
      { test: /\.css$/, loader: "css" },
      { test: /\.html$/, loader: "dom!html" },
    ]
  },
  plugins: [
    new webpack.DefinePlugin({PRODUCTION: false,
                              BROWSER: false}),
  ],
  devtool: "source-map"
};
