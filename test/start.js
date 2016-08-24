/* As per https://github.com/webpack/mocha-loader .
 *
 * We follow the convention used in the Go language whereby test file names are
 * expected to be suffixed with the string `_test`:
 * e.g. `htmlhighlighter_test.js`. */
const context = require.context('mocha!../src/', true, /_test.js$/);
context.keys().forEach(context);
