/* eslint-disable no-use-before-define */
import * as hh from '../src/main';

import bootstrap from './bootstrap';
import { data } from './tests';
import * as attest from './attest';
import html from './html/index.html';

bootstrap(html);

// Test-wide attributes
const container = document.getElementById('container');
let hl;

function init(ndx) {
  // Ensure window and document exist in jsdom environment
  if (window == null || document == null || document.body == null) {
    throw new Error('DOM environment not available');
  }

  document.body.innerHTML = data[ndx || 0];
  hl = new hh.HtmlHighlighter(getOptions());
  attest.clear();

  return hl;
}

function getOptions() {
  return {
    container: document.body,
    maxHighlight: 100,
  };
}

function get() {
  return hl;
}

export { container, init, get };
