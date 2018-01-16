/* eslint-disable no-use-before-define */
import * as hh from '../src/main';

import bootstrap from './bootstrap';
import { data } from './tests';
import * as attest from './attest';
import html from './html/index.html';

bootstrap(html);

// Test-wide attributes
let container;
let instance;

function init(ndx) {
  // Ensure window and document exist in jsdom environment
  if (window == null || document == null || document.body == null) {
    throw new Error('DOM environment not available');
  }

  if (container) {
    container.remove();
  }

  container = document.createElement('div');
  container.innerHTML = data[ndx || 0];
  container.style.position = 'absolute';
  container.style.top = '-200%';
  container.style.left = '-200%';
  document.body.appendChild(container);

  instance = new hh.HtmlHighlighter(getOptions());
  attest.clear();

  return instance;
}

function getOptions() {
  return { container, maxHighlight: 100 };
}

function get(what) {
  switch (what) {
    case undefined:
    case null:
    case 'instance':
      return instance;

    case 'container':
      return container;

    case 'all':
      return { container, highlighter: instance };

    default:
      throw new Error(`Unknown type: ${what}`);
  }
}

function querySelector(selector) {
  return container.querySelector(selector);
}

function querySelectorAll(selector) {
  return container.querySelectorAll(selector);
}

export { init, get, querySelector, querySelectorAll };
