const jsdom = require("jsdom-global");

/* global BROWSER, require */
// The following block taken verbatim from the diffeo-recommend-ui repository
// --
// Get useful backtraces from original source files.
if(!BROWSER) {
  // The module will not even load in a non-Node context so don"t try.
  /* eslint-disable global-require */
  var sourceMapSupport = require("source-map-support");
  sourceMapSupport.install({
    environment: "node"
  });
  /* eslint-enable global-require */
}

/** Initialise the test environment.
 *
 * Default exported function that initialises the test environment and injects
 * an optional HTML view in to the virtual DOM.
 *
 * @param {string} view - HTML to inject in virtual DOM.
 */
var init = function (view)
{
  // Get DOM emulation in Node.  This isn't harmful in a browser context
  // and we should always turn it on.  It must be turned on before
  // anything tries to import jQuery.
  jsdom(view);
};


module.exports = init;