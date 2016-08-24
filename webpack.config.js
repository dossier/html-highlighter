"use strict";

const webpack = require("webpack");
const fs = require("fs");
const HtmlWebpackPlugin = require("html-webpack-plugin");

const env = process.env;
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

let lib = {
  entry: {html_highlighter: "./src/main.js"},
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
  plugins: [
    new webpack.DefinePlugin({
      PRODUCTION: isProduction,
      BROWSER: true
    }),
    new webpack.NoErrorsPlugin(),
    new webpack.optimize.OccurrenceOrderPlugin(true),
    new webpack.BannerPlugin(fs.readFileSync("./LICENSE", "utf8"))
  ],
  devtool: "#source-map"
};

let examples = {
  entry: [
    "./examples/ui/index.html",
    "./examples/ui/main.js",
    "./examples/ui/theme.css",
    "./examples/media/images/logo.png",
    "./etc/data/viber_attacked_by_syrian_electronic_army.json",
    "./etc/data/viber_attacked_by_syrian_electronic_army-cropped.json",
    "./etc/data/ars_technica.json",
    "./etc/data/simple.json",
    "./etc/data/spaces.json",
    "./etc/data/one_paragraph.json",
    "./etc/data/one_paragraph-ampersand.json",
    "./etc/data/one_paragraph-ampersand_escaped.json",
    "./etc/data/one_paragraph-ampersand_nonexistent.json"
  ],
  output: {
    path: "./dist",
    filename: "examples.js"
  },
  module: {
    loaders: [
      { test: /\.html$/, loader: "file?name=[path][name].[ext]" },
      { test: /\.css$/, loader: "file?name=[path][name].[ext]" },
      { test: /\.js$/, loader: "file?name=[path][name].[ext]" },
      { test: /\.json$/, loader: "file?name=examples/data/[name].[ext]" },
      { test: /\.png$/, loader: "file?name=[path][name].[ext]" },
    ]
  }
};

let tests = {
  entry: './test/start.js',
  output: {
    path: "./dist",
    filename: "test.js"
  },
  module: {
    preLoaders: linters,
    loaders: [
      jsLoader,
      { test: /\.json$/, loader: "json" },
      { test: /\.css$/, loader: "style!css" },
      { test: /\.html$/, loader: "dom!html" },
      { test: /\.gif$/, loader: "null" },
      { test: /\.png$/, loader: "null" },
      { test: /\.svg$/, loader: "null" }
    ]
  },
  plugins: [
    new webpack.DefinePlugin({PRODUCTION: isProduction,
                              BROWSER: true}),
    new HtmlWebpackPlugin({
      title: 'HTML Highlighter Tests',
      filename: 'test.html'
    })
  ],
  devtool: "#inline-source-map",
  htmlhint: {
    configFile: '.htmlhintrc'
  }
};

if(isProduction) {
/*   Disabled for now. */
/*   lib.module.postLoaders.push( */
/*   { test: /\.js$/, exclude: /node_modules/, */
/*     loader: "documentation" } */
/*   ); */
/*   lib.documentation = { */
/*     format: "html", */
/*     output: "html_highlighter.js.html" */
/*   } */

  /* Append `.min` suffix after file name, drop duplicate symbols and minify
   * build artifacts. */
  lib.output.filename = "[name].min.js";
  lib.plugins.push(new webpack.optimize.DedupePlugin());
  lib.plugins.push(new webpack.optimize.UglifyJsPlugin({
    compress: {warnings: false}
  }));
}

module.exports = [lib, examples];

if(!isProduction) module.exports.push(tests);