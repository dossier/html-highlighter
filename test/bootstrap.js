/* global BROWSER, require */
/* Taken verbatim from diffeo-recommend-ui/test */

/**
 * Setup bootstrapping for DRUI tests.
 */

// Get DOM emulation in Node.  This isn't harmful in a browser context
// and we should always turn it on.  It must be turned on before
// anything tries to import jQuery.
var jsdom = require('jsdom-global');
jsdom();

// Get useful backtraces from original source files.
if(!BROWSER) {
  // The module will not even load in a non-Node context so don't try.
  /* eslint-disable global-require */
  var sourceMapSupport = require('source-map-support');
  sourceMapSupport.install({
    environment: 'node'
  });
  /* eslint-enable global-require */
}
