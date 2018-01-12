/* eslint-disable no-use-before-define */
import chai from 'chai';

import * as instance from './instance';
import * as attest from './attest';
import { tests } from './tests';

const { assert, expect } = chai;

function dedup(arr) {
  const seen = {};
  const result = [];

  for (let i = 0, l = arr.length; i < l; ++i) {
    const j = getHighlightID(arr[i]);

    if (seen[j] !== true) {
      seen[j] = true;
      result.push(j);
    }
  }

  return result;
}

function select(sn, so, en, eo) {
  let result;
  const range = document.createRange();
  const sel = window.getSelection();

  if (!sel) {
    throw new Error('Unsupported: window.getSelection');
  }

  const { highlighter, container } = instance.get('all');
  container.style.display = 'block';
  highlighter.clearSelectedRange();

  range.setStart(sn, so);
  range.setEnd(en, eo);

  sel.removeAllRanges();
  sel.addRange(range);

  result = highlighter.getSelectedRange();
  container.style.display = 'none';

  return result;
}

function firstTextOf(node) {
  if (node.nodeType === 3) {
    return node;
  }

  for (let i = 0, l = node.childNodes.length; i < l; ++i) {
    node = firstTextOf(node.childNodes[i]);
    if (node !== null) {
      return node;
    }
  }

  return null;
}

function lastTextOf(node) {
  if (node.nodeType === 3) {
    return node;
  }

  for (let i = node.childNodes.length - 1; i >= 0; --i) {
    node = firstTextOf(node.childNodes[i]);
    if (node !== null) {
      return node;
    }
  }

  return null;
}

function lengthOf(node) {
  if (node.nodeType === 3) {
    return node.nodeValue.length;
  }

  let length = 0;
  for (let i = 0, l = node.childNodes.length; i < l; ++i) {
    length += lengthOf(node.childNodes[i]);
  }

  return length;
}

function textOf(node) {
  if (node.nodeType === 3) {
    return node.nodeValue;
  }

  let text = '';
  for (let i = 0, l = node.childNodes.length; i < l; ++i) {
    text += textOf(node.childNodes[i]);
  }

  return text;
}

function selectStandard() {
  const p = instance.querySelectorAll('p')[2];
  const ft = firstTextOf(p);
  const lt = lastTextOf(p);
  let result;

  assert.isAbove(p.childNodes.length, 1, 'length of second paragraph');
  assert.isNotNull(ft, 'has first text node');
  assert.isNotNull(lt, 'has last text node');

  try {
    result = select(ft, 0, lt, lt.nodeValue.length);
  } catch (x) {
    console.error('`window.document.createRange` unavailable in jsdom env: test disabled');

    return null;
  }

  attest.selectionRange(result);
  expect(result.computeXpath()).to.deep.equal({
    end: { offset: 260, xpath: '/p[3]/text()[1]' },
    start: { offset: 0, xpath: '/p[3]/a[1]/text()[1]' },
  });
  return result;
}

function highlight(name, qsetname) {
  if (qsetname === undefined) {
    qsetname = name;
  }

  const hl = instance.get();
  hl.add('test-' + qsetname, [tests[name].xpath]);
  attest.highlight(hl.lastId - 1, tests[name].text);
}

function getHighlightID(cl) {
  return cl.className.match(/hh-highlight-id-(\d+)/)[1];
}

export { dedup, select, firstTextOf, lastTextOf, lengthOf, textOf, selectStandard, highlight };
