/* global BROWSER */
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
let full = false;

// Switch to debug mode
hh.HtmlHighlighter.debug = true;

function assertJsDOM() {
  // Ensure window and document exist in jsdom environment
  if (window == null || document == null || document.body == null) {
    throw new Error('DOM environment not available');
  }
}

function clear() {
  if (full) {
    full = false;
  } else if (container) {
    container.remove();
  }

  container = null;
}

function init(ndx) {
  assertJsDOM();
  clear();

  container = document.createElement('div');
  container.innerHTML = data[ndx || 0];
  container.style.position = 'absolute';
  container.style.top = '-200%';
  container.style.left = '-200%';
  document.body.appendChild(container);

  instance = new hh.HtmlHighlighter(getOptions());
  hh.setDebugging(true);
  attest.clear();

  return instance;
}

function initFull(ndx) {
  assertJsDOM();
  clear();

  if (BROWSER) {
    throw new Error('Full mode can only be run in non-browser mode');
  }

  bootstrap(data[ndx]);
  full = true;
  container = document;
  instance = new hh.HtmlHighlighter(getOptions());
  attest.clear();

  return instance;
}

function isFull() {
  return full;
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

export { init, initFull, isFull, get, querySelector, querySelectorAll };
