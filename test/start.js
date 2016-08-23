/* As per https://github.com/webpack/mocha-loader . */
const context = require.context('mocha!.', true, /_test.js$/);
context.keys().forEach(context);
