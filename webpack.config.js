/* global process */

const webpack = require("webpack");
const fs = require("fs");
const HtmlWebpackPlugin = require("html-webpack-plugin");

const env = process.env;  // eslint-disable-line no-process-env
const isProduction = env.NODE_ENV === "production";

const linters = [
  { test: /\.js$/, exclude: /node_modules|examples/, loader: "eslint" }
];

const jsLoader = {
  test: /.js$/,
  loader: "babel",
  exclude: /node_modules/,
  query: {
    presets: ["es2015"],
    cacheDirectory: true
  }
};

const lib = {
  entry: {htmlhighlighter: "./src/main.js"},
  output: {
    path: "./dist",
    filename: "[name].js",
    library: "[name]",
    libraryTarget: "umd",
    umdNamedDefine: true
  },
  module: {
    preLoaders: linters,
    loaders: [jsLoader],
    postLoaders: [/* defined if not production; see below */]
  },
  externals: {
    jquery: "jQuery"
  },
  plugins: [
    new webpack.DefinePlugin({
      PRODUCTION: isProduction,
      BROWSER: true
    }),
    new webpack.ProvidePlugin({
      $: "jquery",
      jQuery: "jquery",
      "window.jQuery": "jquery"
    }),
    new webpack.NoErrorsPlugin(),
    new webpack.optimize.OccurrenceOrderPlugin(true),
    new webpack.BannerPlugin(fs.readFileSync("./LICENSE", "utf8"))
  ],
  devtool: "#source-map"
};

const examples = {
  entry: {
    monolith: "./examples/monolith/main.js"
  },
  output: {
    path: "./dist/examples",
    filename: "[name]/[name].js"
  },
  module: {
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
      { test: /\.css$/, loader: "style!css" },
      { test: /\.json$/, loader: "json" }
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      chunks: ["monolith"],
      title: "HTML Highlighter -- main example",
      template: "./examples/monolith/main.html",
      filename: "monolith/index.html"
    })
  ],
  devtool: "#source-map"
};

const assets = {
  entry: [
    "./examples/media/images/logo.png",
  ],
  output: {
    path: "./dist",
    filename: "assets.js"
  },
  module: {
    loaders: [
      { test: /\.json$/, loader: "file?name=examples/data/[name].[ext]" },
      { test: /\.png$/, loader: "file?name=[path][name].[ext]" }
    ]
  }
};

const tests = {
  entry: "mocha!./test/start.js",
  output: {
    path: "./dist",
    filename: "test.js"
  },
  module: {
    preLoaders: linters,
    loaders: [
      jsLoader,
      { test: /\.html$/, loader: "raw-loader" },
      { test: /\.json$/, loader: "json" },
      { test: /\.css$/, loader: "style!css" }
    ]
  },
  plugins: [
    new webpack.DefinePlugin({PRODUCTION: isProduction,
                              BROWSER: true}),
    new HtmlWebpackPlugin({
      title: "HTML Highlighter Tests",
      template: "./test/html/index.html",
      filename: "test.html"
    })
  ],
  devtool: "#inline-source-map"
};

if(isProduction) {
  // Documentation disabled for now.
  // --
  // lib.module.postLoaders.push({
  //   test: /\.js$/, exclude: /node_modules/,
  //   loader: "documentation"
  // });
  //
  // lib.documentation = {
  //   format: "html",
  //   output: "html_highlighter.js.html"
  // };

  // Append `.min` suffix after file name, drop duplicate symbols and minify
  // build artifacts.
  lib.output.filename = "[name].min.js";
  lib.plugins.push(new webpack.optimize.DedupePlugin());
  lib.plugins.push(new webpack.optimize.UglifyJsPlugin({
    compress: {warnings: false}
  }));
}

module.exports = [lib, examples, assets, tests];
