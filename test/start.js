const context = require.context('mocha!.', true, /_test.js$/);
context.keys().forEach(context);
