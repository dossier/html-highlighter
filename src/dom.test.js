// @flow
/* global describe, beforeEach, afterEach, it */
/* eslint-disable no-use-before-define */

import chai from 'chai';

import bootstrap from '../test/bootstrap';
import * as tools from '../test/toolbox';
import * as attest from '../test/attest';

import * as dom from './dom';

const { assert } = chai;

bootstrap();

describe('dom', () => {
  afterEach(() => tools.removeAll('body > *'));

  describe('classNameToSet', () => {
    const testClasses = ['one', 'two', 'three'];

    const assertClasses = (result: Set<string>) => {
      assert.strictEqual(result.size, testClasses.length);
      testClasses.forEach(cl => assert.ok(result.has(cl)));
    };

    it('produces a set', () => {
      assert.ok(dom.classNameToSet(tools.createElement()) instanceof Set);
    });

    it('produces an empty set when no class names present', () => {
      assert.strictEqual(dom.classNameToSet(tools.createElement()).size, 0);
    });

    it('produces a set of class names present', () => {
      assertClasses(dom.classNameToSet(tools.createElement({ classes: testClasses })));
    });

    it('does not produce empties from spaces', () => {
      assertClasses(dom.classNameToSet(tools.createElement({ classes: 'one  two    three   ' })));
    });
  });

  describe('ensureIterable', () => {
    it('does nothing if already a NodeList', () => {
      const r = dom.ensureIterable(document.querySelectorAll('*'));
      assert.ok(r instanceof NodeList);
    });

    it('creates a Set if given single element', () => {
      const r = dom.ensureIterable(tools.createElement());
      assert.ok(r instanceof Set);
    });
  });

  describe('addClass', () => {
    it('adds first class name to single element', () => {
      const el = tools.createElement();
      dom.addClass(el, 'foo');
      attest.className(el, 'foo');
    });

    it('appends a class name to single element', () => {
      const el = tools.createElement({ classes: 'test' });
      dom.addClass(el, 'foo');
      attest.className(el, ['test', 'foo']);
    });

    it('appends a single class name to NodeList', () => {
      tools.createElement({ classes: 'test', appendTo: 'body' });
      tools.createElement({ classes: 'test', appendTo: 'body' });
      dom.addClass(document.querySelectorAll('.test'), 'foo');
      attest.classNameAll(document.querySelectorAll('.test'), ['test', 'foo']);
    });
  });

  describe('removeClass', () => {
    it('does nothing if no classes in single element', () => {
      const el = tools.createElement();
      dom.removeClass(el, 'foo');
      attest.className(el, '');
    });

    it('does nothing if no classes in NodeList', () => {
      tools.createElement({ appendTo: 'body' });
      tools.createElement({ appendTo: 'body' });
      dom.removeClass(document.querySelectorAll('.test'), 'foo');
      attest.classNameAll(document.querySelectorAll('.test'), '');
    });

    it('does nothing if given class not present in single element', () => {
      const el = tools.createElement({ classes: 'test foo bar baz' });
      dom.removeClass(el, 'nope');
      dom.removeClass(el, 'dope');
      attest.className(el, 'test foo bar baz');
    });

    it('does nothing if given class not present in NodeList', () => {
      tools.createElement({ classes: 'test foo bar baz', appendTo: 'body' });
      tools.createElement({ classes: 'test foo bar baz', appendTo: 'body' });
      dom.removeClass(document.querySelectorAll('.test'), 'nope');
      dom.removeClass(document.querySelectorAll('.test'), 'dope');
      attest.classNameAll(document.querySelectorAll('.test'), 'test foo bar baz');
    });

    it('removes class name from single element', () => {
      const el = tools.createElement({ classes: 'test foo' });
      dom.removeClass(el, 'foo');
      attest.className(el, 'test');
    });

    it('removes multiple class names from single element', () => {
      const el = tools.createElement({ classes: 'test foo bar baz' });
      dom.removeClass(el, 'foo');
      dom.removeClass(el, 'bar');
      attest.className(el, 'test baz');
    });

    it('removes class name from NodeList', () => {
      tools.createElement({ classes: 'test foo', appendTo: 'body' });
      tools.createElement({ classes: 'test foo', appendTo: 'body' });
      attest.classNameAll(document.querySelectorAll('.test'), 'test foo');
      dom.removeClass(document.querySelectorAll('.test'), 'foo');
      attest.classNameAll(document.querySelectorAll('.test'), 'test');
    });

    it('removes multiple class names from NodeList', () => {
      tools.createElement({ classes: 'test foo bar baz', appendTo: 'body' });
      tools.createElement({ classes: 'test foo bar baz', appendTo: 'body' });
      attest.classNameAll(document.querySelectorAll('.test'), 'test foo bar baz');
      dom.removeClass(document.querySelectorAll('.test'), 'foo');
      dom.removeClass(document.querySelectorAll('.test'), 'bar');
      attest.classNameAll(document.querySelectorAll('.test'), 'test baz');
    });
  });

  describe('getHighlightElements', () => {
    it('returns expected single highlight element', () => {
      tools.makeHighlight(1, 1, { appendTo: 'body' });
      assert.strictEqual(dom.getHighlightElements(1).length, 1);
    });

    it('returns expected multiple-part highlight element', () => {
      tools.makeHighlight(1, 1, { appendTo: 'body' });
      tools.makeHighlight(1, 1, { appendTo: 'body' });
      assert.strictEqual(dom.getHighlightElements(1).length, 2);
    });

    it('returns expected single highlight element within noise', () => {
      for (let i = 10; i <= 100; ++i) {
        tools.makeHighlight(i, 1, { appendTo: 'body' });
      }

      tools.makeHighlight(1, 2, { appendTo: 'body' });
      assert.strictEqual(dom.getHighlightElements(1).length, 1);
    });

    it('returns expected multiple-part highlight element within noise', () => {
      for (let i = 10; i <= 100; ++i) {
        tools.makeHighlight(i, 1, { appendTo: 'body' });
      }

      tools.makeHighlight(1, 2, { appendTo: 'body' });
      tools.makeHighlight(1, 2, { appendTo: 'body' });
      assert.strictEqual(dom.getHighlightElements(1).length, 2);
    });

    it('does not return anything when not present', () => {
      for (let i = 1; i <= 100; ++i) {
        tools.makeHighlight(i, i % 2 + 1, { appendTo: 'body' });
      }

      assert.strictEqual(dom.getHighlightElements(101).length, 0);
    });
  });

  describe('getForQuerySet', () => {
    it('returns expected single highlight element', () => {
      tools.makeHighlight(1, 1, { appendTo: 'body' });
      assert.strictEqual(dom.getForQuerySet(1).length, 1);
    });

    it('returns expected multiple-part highlight element', () => {
      tools.makeHighlight(1, 1, { appendTo: 'body' });
      tools.makeHighlight(1, 1, { appendTo: 'body' });
      assert.strictEqual(dom.getForQuerySet(1).length, 2);
    });

    it('returns expected single highlight element within noise', () => {
      for (let i = 1; i <= 100; ++i) {
        tools.makeHighlight(i, 1, { appendTo: 'body' });
      }

      assert.strictEqual(dom.getForQuerySet(1).length, 100);

      tools.makeHighlight(101, 2, { appendTo: 'body' });
      assert.strictEqual(dom.getForQuerySet(2).length, 1);
    });

    it('returns expected multiple-part highlight element within noise', () => {
      for (let i = 1; i <= 100; ++i) {
        tools.makeHighlight(i, 1, { appendTo: 'body' });
      }

      assert.strictEqual(dom.getForQuerySet(1).length, 100);

      tools.makeHighlight(1, 2, { appendTo: 'body' });
      tools.makeHighlight(1, 2, { appendTo: 'body' });
      assert.strictEqual(dom.getForQuerySet(2).length, 2);
    });

    it('does not return anything when not present', () => {
      for (let i = 1; i <= 100; ++i) {
        tools.makeHighlight(i, Math.floor((i - 1) / 2) + 1, { appendTo: 'body' });
      }

      assert.strictEqual(dom.getForQuerySet(50).length, 2);
      assert.strictEqual(dom.getForQuerySet(51).length, 0);
    });
  });

  describe('getAllHighlightElements', () => {
    it('returns expected single highlight element', () => {
      tools.makeHighlight(1, 1, { appendTo: 'body' });
      assert.strictEqual(dom.getAllHighlightElements().length, 1);
    });

    it('returns expected multiple-part highlight element', () => {
      tools.makeHighlight(1, 1, { appendTo: 'body' });
      tools.makeHighlight(1, 1, { appendTo: 'body' });
      assert.strictEqual(dom.getAllHighlightElements().length, 2);
    });

    it('returns expected multiple highlights across many query sets', () => {
      for (let i = 1; i <= 100; ++i) {
        tools.makeHighlight(i, Math.floor(i / 2) + 1, { appendTo: 'body' });
      }

      assert.strictEqual(dom.getAllHighlightElements().length, 100);
    });

    it('does not return anything when none present', () => {
      assert.strictEqual(dom.getAllHighlightElements().length, 0);
    });
  });

  describe('createHighlightElement', () => {
    let parent;
    let text;

    beforeEach(() => {
      parent = document.createElement('div');
      text = document.createTextNode('test');
      parent.appendChild(text);
    });

    afterEach(() => {
      if (parent) {
        parent.remove();
        parent = null;
      }

      text = null;
    });

    it('creates an element', () => {
      assert.ok(dom.createHighlightElement((text: any), 'foo') instanceof HTMLElement);
    });

    it('creates a span element', () => {
      assert.strictEqual(
        dom.createHighlightElement((text: any), 'foo').nodeName.toLowerCase(),
        'span'
      );
    });

    it('assigns given class names', () => {
      assert.strictEqual(dom.createHighlightElement((text: any), 'foo').className, 'foo');
    });

    it('replaces text node', () => {
      assert.ok(dom.createHighlightElement((text: any), 'foo').childNodes);
      assert.strictEqual(dom.createHighlightElement((text: any), 'foo').childNodes.length, 1);
      assert.strictEqual(dom.createHighlightElement((text: any), 'foo').childNodes[0], text);
      assert.strictEqual(
        dom.createHighlightElement((text: any), 'foo').childNodes[0].nodeType,
        Node.TEXT_NODE
      );
    });
  });

  describe('insertBefore', () => {
    let parent;
    let text;

    beforeEach(() => {
      parent = document.createElement('div');
      text = document.createTextNode('test');
      parent.appendChild(text);
    });

    afterEach(() => {
      if (parent) {
        parent.remove();
        parent = null;
      }

      text = null;
    });

    it('inserts before specified node', () => {
      assert.strictEqual(dom.insertBefore(tools.createElement(), (text: any)).nextSibling, text);
    });

    it('returns inserted node', () => {
      const node = tools.createElement();
      assert.strictEqual(dom.insertBefore(node, (text: any)), node);
    });
  });

  describe('insertAfter', () => {
    let parent;
    let text;

    beforeEach(() => {
      parent = document.createElement('div');
      text = document.createTextNode('test');
      parent.appendChild(text);
    });

    afterEach(() => {
      if (parent) {
        parent.remove();
        parent = null;
      }

      text = null;
    });

    it('inserts after specified node', () => {
      assert.strictEqual(dom.insertAfter(tools.createElement(), (text: any)).previousSibling, text);
    });

    it('returns inserted node', () => {
      const node = tools.createElement();
      assert.strictEqual(dom.insertAfter(node, (text: any)), node);
    });
  });

  // The following methods are untestable in jsdom and would require an actual browser environment
  // like the sort provided by WebDriver.
  describe('getOffset', () => {});
  describe('isInView', () => {});
  describe('scrollIntoView', () => {});
});
