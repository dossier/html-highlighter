/* eslint-disable no-use-before-define */
import chai from 'chai';

import * as instance from './instance';
import * as ops from './operations';
import * as tools from './toolbox';

const { assert } = chai;

function clear() {
  assert.strictEqual(
    instance.querySelectorAll('.hh-highlight').length,
    0,
    'there are no highlights'
  );

  totalHighlights(0, 0);
}

/**
 * Total highlights and query set assertion
 *
 * @param {number} hc - Highlight count
 * @param {number} qc - Query set count
 */
function totalHighlights(hc, qc = 1) {
  const queries = new Set();
  const highlights = new Set();

  for (const el of instance.querySelectorAll('.hh-highlight')) {
    /* eslint-disable no-empty */
    try {
      const qid = el.className.match(/hh-highlight-(\d+)/)[1];
      const hid = el.className.match(/hh-highlight-id-(\d+)/)[1];
      queries.add(qid);
      highlights.add(hid);
    } catch (x) {}
    /* eslint-enable no-empty */
  }

  const hl = instance.get();
  assert.strictEqual(queries.size, qc);
  assert.strictEqual(highlights.size, hc);
  assert.strictEqual(hl.stats.queries, qc);
  assert.strictEqual(hl.stats.total, hc);
}

function selectionRange(range) {
  assert.isNotNull(range, 'have selection range');
  assert.isObject(range);
  assert.isFunction(range.computeXpath);

  const xpath = range.computeXpath();
  assert.isObject(xpath);
  assert.property(xpath, 'start', 'xpath has valid structure');
  assert.deepProperty(xpath, 'start.xpath', 'xpath has valid structure');
  assert.deepProperty(xpath, 'start.offset', 'xpath has valid structure');
  assert.property(xpath, 'end', 'xpath has valid structure');
  assert.deepProperty(xpath, 'end.xpath', 'xpath has valid structure');
  assert.deepProperty(xpath, 'end.offset', 'xpath has valid structure');
}

function highlight(id, text) {
  let l = 0;
  let t = '';

  for (const el of instance.querySelectorAll(`.hh-highlight-id-${id}`)) {
    l += ops.lengthOf(el);
    t += ops.textOf(el);
  }

  assert.strictEqual(t, text, 'expected highlight text');
  assert.strictEqual(l, text.length, 'expected highlight length');
}

function cursor(position, total = null) {
  const hl = instance.get();
  assert.strictEqual(hl.cursor.total, total == null ? hl.stats.total : total);
  assert.strictEqual(hl.cursor.index, position);
}

function currentHighlight(id) {
  const el = document.querySelector(`.hh-highlight-id-${id}`);
  assert.ok(el != null);
  assert.ok(el.classList.contains('hh-enabled'));
}

// function className(element: Element, className: string | Array<string>): void {
function className(element, classNames) {
  const elc = tools.classNameToSet(element.className);
  const cmpc = tools.classNameToSet(classNames);

  assert.strictEqual(elc.size, cmpc.size);
  for (const cl of elc) {
    assert.ok(cmpc.has(cl));
  }
}

// function classNameAll(elements: NodeList<Element>, classNames: string | Array<string>): void {
function classNameAll(elements, classNames) {
  for (const el of elements) {
    className(el, classNames);
  }
}

function snapshot(old) {
  const current = instance.snapshot();
  assert.deepEqual(current, old);
}

export {
  clear,
  totalHighlights,
  selectionRange,
  highlight,
  cursor,
  currentHighlight,
  className,
  classNameAll,
  snapshot,
};
