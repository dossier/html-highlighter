const webpack = require("webpack");
const nodeExternals = require("webpack-node-externals");

module.exports = {
  target: "node",
  externals: [nodeExternals()],
  module: {
    rules: [
      {
        enforce: "pre",
        test: /\.js$/,
        exclude: /node_modules|\.test\.js$/,
        loader: "eslint-loader",
      }, {
        test: /.js$/,
        loader: "babel-loader",
        exclude: /node_modules/,
        query: {
          cacheDirectory: true,
        },
      }, {
        test: /\.json$/, loader: "json-loader",
      }, {
        test: /\.css$/, loader: "css-loader",
      }, {
        test: /\.html$/, loader: "html-loader",
      },
    ],
  },
  plugins: [
    new webpack.DefinePlugin({
      PRODUCTION: false,
      BROWSER: false,
    }),
  ],
  devtool: "source-map",
};
