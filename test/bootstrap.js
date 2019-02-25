/* global global */
/* eslint-disable import/unambiguous */
import jsdom from 'jsdom-global';
import 'babel-polyfill';

// The following block taken verbatim from the diffeo-recommend-ui repository
// --
// Get useful backtraces from original source files.
if (process.env.TEST_ENV !== 'jsdom') {
  // The module will not even load in a non-Node context so don"t try.
  /* eslint-disable global-require */
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install({
    environment: 'node',
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
function init(view) {
  // Get DOM emulation in Node.  This isn't harmful in a browser context
  // and we should always turn it on.  It must be turned on before
  // anything tries to import jQuery.
  jsdom(view);

  // Jsdom does not suppport `requestAnimationFrame`, which forces us to provide a very simple
  // polyfill alternative.
  //
  // IMPORTANT!  Note that assigning the polyfill(s) to either the `window` or `global` object
  // without also assigning to the other is incorrect practice.  BOTH objects must receive the
  // polyfill since `global` !== `window`; rather, `window` is `global.window` and we want
  // a polyfill `window.thisPolyfill` to also be accessible via the valid form `thisPolyfill`.
  if (typeof window.requestAnimationFrame !== 'function') {
    global.requestAnimationFrame = window.requestAnimationFrame = function(callback) {
      setTimeout(callback); // simply defer to next execution tick
    };
  }
}

export default init;
