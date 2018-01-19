// @flow

import merge from 'merge';
import chai from 'chai';

import * as consts from '../src/consts';

const { assert } = chai;

export type CreateElementOptions = {|
  tag?: string,
  classes?: string | Array<string>,
  appendTo?: string,
|};

function createElement(options: CreateElementOptions = createElement.defaults) {
  options = merge(merge({}, createElement.defaults), options);

  const { tag, classes, appendTo } = options;
  const el = (document: any).createElement(tag);
  if (Array.isArray(classes)) {
    el.className = classes.join(' ');
  } else if (typeof classes === 'string') {
    el.className = classes;
  }

  if (appendTo === 'body') {
    document.body.appendChild(el);
  }

  return el;
}

createElement.defaults = {
  tag: 'div',
};

function removeAll(selector: string): void {
  for (const node of document.querySelectorAll(selector)) {
    node.remove();
  }

  assert.strictEqual(document.querySelectorAll(selector).length, 0);
}

function classNameToSet(className: string | Array<string>): Set<string> {
  const carr = typeof className === 'string' ? className.split(' ') : className;
  return new Set(carr.map(cl => cl.trim()).filter(Boolean));
}

function makeHighlight(
  highlightID: number,
  queryID: number = 1,
  options: CreateElementOptions = createElement.defaults
): HTMLElement {
  const hcl = consts.Css.highlight;
  options.tag = 'span';
  options.classes =
    Array.from(classNameToSet(options.classes || '')).join(' ') +
    `${hcl} ${hcl}-${queryID} ${hcl}-id-${highlightID}`;
  return createElement(options);
}

export { createElement, removeAll, classNameToSet, makeHighlight };
