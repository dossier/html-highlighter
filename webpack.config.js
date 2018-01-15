/* global process */

const webpack = require('webpack');
const fs = require('fs');
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const env = process.env; // eslint-disable-line no-process-env
const isProduction = env.NODE_ENV === 'production';

function makeExampleConfig(name) {
  const config = {
    entry: {
      // We always assume that the example's entry filename is `main.js`
      [name]: `./examples/${name}/main.js`,
    },
    output: {
      path: path.join(__dirname, 'dist/examples', name),
      filename: '[name].js',
    },
    module: {
      rules: [
        jsLoader,
        { test: /\.css$/, loader: 'style-loader!css-loader' },
        { test: /\.json$/, loader: 'json-loader' },
      ],
    },
    plugins: [
      new HtmlWebpackPlugin({
        title: 'HTML Highlighter -- main example',
        template: `./examples/${name}/main.html`,
        filename: 'index.html',
      }),
    ],
    devtool: '#source-map',
  };

  if (isProduction) {
    config.module.rules = config.module.rules.concat(linters);
  }

  return config;
}

const linters = [
  {
    enforce: 'pre',
    test: /\.js$/,
    exclude: /node_modules|examples/,
    loader: 'eslint-loader',
  },
];

const jsLoader = {
  test: /.js$/,
  loader: 'babel-loader',
  exclude: /node_modules/,
  query: {
    cacheDirectory: true,
  },
};

const lib = {
  entry: { htmlhighlighter: './src/main.js' },
  output: {
    path: path.join(__dirname, 'dist'),
    filename: '[name].js',
    library: '[name]',
    libraryTarget: 'umd',
    umdNamedDefine: true,
  },
  module: {
    rules: [jsLoader].concat(linters),
  },
  externals: {
    jquery: 'jQuery',
  },
  plugins: [
    new webpack.DefinePlugin({
      PRODUCTION: isProduction,
      BROWSER: true,
    }),
    new webpack.ProvidePlugin({
      $: 'jquery',
      jQuery: 'jquery',
      'window.jQuery': 'jquery',
    }),
    new webpack.NoEmitOnErrorsPlugin(),
    new webpack.optimize.OccurrenceOrderPlugin(true),
    new webpack.BannerPlugin(fs.readFileSync('./LICENSE', 'utf8')),
  ],
  devtool: '#source-map',
};

const assets = {
  entry: ['./examples/media/images/logo.png'],
  output: {
    path: path.join(__dirname, 'dist'),
    filename: 'assets.js',
  },
  module: {
    rules: [
      {
        test: /\.json$/,
        loader: 'file-loader?name=examples/data/[name].[ext]',
      },
      {
        test: /\.png$/,
        loader: 'file-loader?name=[path][name].[ext]',
      },
    ],
  },
};

const tests = {
  entry: 'mocha-loader!./test/start.js',
  output: {
    path: path.join(__dirname, 'dist'),
    filename: 'test.js',
  },
  module: {
    rules: [
      jsLoader,
      { test: /\.html$/, loader: 'html-loader' },
      { test: /\.json$/, loader: 'json-loader' },
      { test: /\.css$/, loader: 'style-loader!css-loader' },
    ].concat(linters),
  },
  plugins: [
    new webpack.DefinePlugin({
      PRODUCTION: isProduction,
      BROWSER: true,
    }),
    new HtmlWebpackPlugin({
      title: 'HTML Highlighter Tests',
      template: './test/html/index.html',
      filename: 'test.html',
    }),
  ],
  devtool: '#inline-source-map',
};

if (isProduction) {
  // Documentation disabled for now.
  // --
  // lib.module.rules.push({
  //   enforce: "post",
  //   test: /\.js$/,
  //   exclude: /node_modules/,
  //   loader: "documentation"
  // });
  //
  // lib.documentation = {
  //   format: "html",
  //   output: "html_highlighter.js.html"
  // };

  // Append `.min` suffix after file name, drop duplicate symbols and minify
  // build artifacts.
  lib.output.filename = '[name].min.js';
  lib.plugins.push(
    new webpack.optimize.UglifyJsPlugin({
      compress: { warnings: false },
    })
  );
}

const examples = [makeExampleConfig('monolith')];
let build = [lib];
if (!isProduction) {
  build = build.concat(examples, [assets, tests]);
}

module.exports = build;
