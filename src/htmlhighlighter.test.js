/* global describe, beforeEach, afterEach, it */
/* eslint-disable no-use-before-define */

import chai from 'chai';

import * as instance from '../test/instance';
import * as ops from '../test/operations';
import { counts } from '../test/tests';
import * as attest from '../test/attest';

const { assert } = chai;

// Test specifications
describe('HTML Highlighter', function() {
  let hl;
  let is;

  describe('General', function() {
    beforeEach('initialise state', function() {
      hl = instance.init();
    });

    afterEach('destroy state', function() {
      hl = null;
    });

    it('initialises', function() {});

    it('adds a query set with a single mention', function() {
      hl.add('test-the', ['the']);
      attest.totalHighlights(counts.the, 1);
      assert.strictEqual(hl.stats.total, counts.the);
    });

    it('adds a query set with multiple mentions', function() {
      const id = hl.lastId;
      hl.add('test-the-viber', ['the', 'viber']);
      const expecting = counts.the + counts.viber;
      attest.totalHighlights(expecting, 1);
      assert.strictEqual(hl.lastId, expecting + id);
    });

    it('does not allow duplicate query sets - I', function() {
      hl.add('test-the', ['the']);
      attest.totalHighlights(counts.the, 1);

      hl.add('test-the', ['the']);
      attest.totalHighlights(counts.the, 1);
    });

    it('does not allow duplicate query sets - II', function() {
      hl.add('test-the', ['the']).add('test-the', ['the']);
      attest.totalHighlights(counts.the, 1);

      hl.add('test-the', ['the']);
      attest.totalHighlights(counts.the, 1);
    });

    it('removes query set when only one exists', function() {
      hl.add('test-the', ['the']);
      attest.totalHighlights(counts.the, 1);

      hl.remove('test-the');
      attest.clear();
    });

    it('removes correct query set when multiple queries exist', function() {
      hl.add('test-the', ['the']);
      attest.totalHighlights(counts.the, 1);

      hl.add('test-viber', ['viber']);
      attest.totalHighlights(counts.the + counts.viber, 2);

      hl.remove('test-the');
      attest.totalHighlights(counts.viber, 1);
    });

    it('removes all query sets when multiple queries exist', function() {
      hl.add('test-the', ['the']);
      attest.totalHighlights(counts.the, 1);

      hl.add('test-viber', ['viber']);
      attest.totalHighlights(counts.the + counts.viber, 2);

      hl.remove('test-the');
      attest.totalHighlights(counts.viber, 1);

      hl.remove('test-viber');
      attest.clear();
    });

    it('clears state when only one query set exists', function() {
      hl.add('test-the', ['the']);
      attest.totalHighlights(counts.the, 1);

      hl.clear();
      attest.clear();
    });

    it('clears state when multiple query sets exist', function() {
      hl.add('test-the', ['the']);
      attest.totalHighlights(counts.the, 1);

      hl.add('test-viber', ['viber']);
      attest.totalHighlights(counts.the + counts.viber, 2);

      hl.clear();
      attest.clear();
    });
  });

  describe('Cursor movement', function() {
    beforeEach('initialise state', function() {
      hl = instance.init();
      attest.cursor(-1);
    });

    afterEach('destroy state', function() {
      hl = null;
    });

    it('moves cursor to next element', function() {
      hl.add('test-the', ['the']);
      attest.totalHighlights(counts.the, 1);

      hl.add('test-viber', ['viber']);
      attest.totalHighlights(counts.the + counts.viber, 2);

      attest.cursor(-1);
      hl.next();
      attest.cursor(0);
    });

    it('moves cursor to previous element', function() {
      hl.add('test-the', ['the']);
      attest.totalHighlights(counts.the, 1);

      hl.add('test-viber', ['viber']);
      attest.totalHighlights(counts.the + counts.viber, 2);

      attest.cursor(-1);
      hl.next();
      attest.cursor(0);
      hl.next();
      attest.cursor(1);
      hl.prev();
      attest.cursor(0);
    });

    it('moves cursor to last element', function() {
      hl.add('test-the', ['the']);
      attest.totalHighlights(counts.the, 1);

      hl.add('test-viber', ['viber']);
      attest.totalHighlights(counts.the + counts.viber, 2);

      for (let i = 0; i < counts.the + counts.viber; ++i) {
        attest.cursor(i - 1);
        hl.next();
      }

      attest.cursor(counts.the + counts.viber - 1);
    });

    it('cursor rolls over to first element from last', function() {
      hl.add('test-the', ['the']);
      attest.totalHighlights(counts.the, 1);

      hl.add('test-viber', ['viber']);
      attest.totalHighlights(counts.the + counts.viber, 2);

      for (let i = 0; i < counts.the + counts.viber + 1; ++i) {
        attest.cursor(i - 1);
        hl.next();
      }

      attest.cursor(0);
    });

    it('cursor rolls over to last element from first', function() {
      hl.add('test-the', ['the']);
      attest.totalHighlights(counts.the, 1);

      hl.add('test-viber', ['viber']);
      attest.totalHighlights(counts.the + counts.viber, 2);

      attest.cursor(-1);
      hl.prev();
      attest.cursor(counts.the + counts.viber - 1);
    });

    it('cursor rolls over to last element from first and back', function() {
      hl.add('test-the', ['the']);
      attest.totalHighlights(counts.the, 1);

      hl.add('test-viber', ['viber']);
      attest.totalHighlights(counts.the + counts.viber, 2);

      attest.cursor(-1);
      hl.prev();
      attest.cursor(counts.the + counts.viber - 1);

      hl.next();
      attest.cursor(0);
    });

    describe('Iterable queries', function() {
      beforeEach('initialise state', function() {
        hl = instance.init();

        hl.add('test-the', ['the']);
        hl.add('test-viber', ['viber']);
        attest.totalHighlights(counts.the + counts.viber, 2);
      });

      afterEach('destroy state', function() {
        hl = null;
      });

      it('allows setting of iterable queries', function() {
        hl.setIterableQueries('test-the');
        attest.cursor(-1, counts.the);
      });

      it('resets the cursor position', function() {
        attest.cursor(-1);
        hl.setIterableQueries('test-the');
        attest.cursor(-1, counts.the);
        hl.next();
        attest.cursor(0, counts.the);

        hl.setIterableQueries('test-viber');
        attest.cursor(-1, counts.viber);
      });

      it('allows setting of iterable queries multiple times', function() {
        hl.setIterableQueries('test-the');
        attest.cursor(-1, counts.the);

        hl.setIterableQueries('test-viber');
        attest.cursor(-1, counts.viber);

        hl.setIterableQueries(['test-the', 'test-viber']);
        attest.cursor(-1, counts.the + counts.viber);
      });

      it('allows unsetting of iterable queries', function() {
        hl.setIterableQueries('test-the');
        attest.cursor(-1, counts.the);

        hl.setIterableQueries('test-viber');
        attest.cursor(-1, counts.viber);

        hl.setIterableQueries(null);
        attest.cursor(-1);
      });

      it('moves cursor to next element', function() {
        hl.setIterableQueries('test-the');
        attest.cursor(-1, counts.the);
        hl.next();
        attest.cursor(0, counts.the);
      });

      it('moves cursor to previous element', function() {
        hl.setIterableQueries('test-the');

        attest.cursor(-1, counts.the);
        hl.next();
        attest.cursor(0, counts.the);
        hl.next();
        attest.cursor(1, counts.the);
        hl.prev();
        attest.cursor(0, counts.the);
      });

      it('moves cursor to last element', function() {
        hl.setIterableQueries('test-the');
        attest.cursor(-1, counts.the);

        for (let i = 0; i < counts.the; ++i) {
          hl.next();
          attest.cursor(i, counts.the);
        }
      });

      it('cursor rolls over to first element from last', function() {
        hl.setIterableQueries('test-the');

        for (let i = 0; i < counts.the + 1; ++i) {
          attest.cursor(i - 1, counts.the);
          hl.next();
        }

        attest.cursor(0, counts.the);
      });

      it('cursor rolls over to last element from first', function() {
        hl.setIterableQueries('test-the');
        attest.cursor(-1, counts.the);
        hl.prev();
        attest.cursor(counts.the - 1, counts.the);
      });

      it('cursor rolls over to last element from first and back', function() {
        hl.setIterableQueries('test-the');
        attest.cursor(-1, counts.the);
        hl.prev();
        attest.cursor(counts.the - 1, counts.the);

        hl.next();
        attest.cursor(0, counts.the);
      });
    });
  });

  describe('Text selection', function() {
    beforeEach('initialise state', function() {
      hl = instance.init();
    });

    afterEach('destroy state', function() {
      hl = null;
    });

    it('correctly selects text', function() {
      ops.selectStandard();
    });

    it('correctly selects text after single query set add', function() {
      hl.add('test-the', ['the']);
      assert.strictEqual(hl.stats.total, counts.the);
      ops.selectStandard();
    });

    it('correctly selects text after second query set add', function() {
      hl.add('test-the', ['the']);
      hl.add('test-viber', ['viber']);
      attest.totalHighlights(counts.the + counts.viber, 2);
      ops.selectStandard();
    });

    it('correctly selects text after dense query set add', function() {
      hl
        .add('test-the', ['the'])
        .add('test-viber', ['viber'])
        .add('test-a', ['a']);
      attest.totalHighlights(counts.the + counts.viber + counts.a, 3);
      ops.selectStandard();
    });
  });

  describe('XPath', function() {
    describe('Basic', function() {
      beforeEach('initialise state', function() {
        hl = instance.init();
      });

      afterEach('destroy state', function() {
        hl = null;
      });

      it('can cope with XPath representations in uppercase', function() {
        ops.highlight('uppercase');
      });

      is = "highlights the 'standard' query set from XPath representation";
      it(is, function() {
        ops.highlight('standard');
      });

      is = "highlights the 'wrapElement' query set from XPath representation";
      it(is, function() {
        ops.highlight('wrapElement');
      });

      is = "highlights the 'multiElement' query set from XPath representation";
      it(is, function() {
        ops.highlight('multiElement');
      });

      is = "highlights the 'bottomup' query set from XPath representation";
      it(is, function() {
        ops.highlight('bottomup');
      });

      it('highlights one query set from XPath representation', function() {
        ops.highlight('standard');
      });

      it('highlights two query sets from XPath representations', function() {
        ops.highlight('standard');
        ops.highlight('wrapElement');
      });

      it('highlights three query sets from XPath representations', function() {
        ops.highlight('standard');
        ops.highlight('wrapElement');
        ops.highlight('multiElement');
      });

      it('highlights four query sets from XPath representations', function() {
        ops.highlight('standard');
        ops.highlight('wrapElement');
        ops.highlight('multiElement');
        ops.highlight('bottomup');
      });
    });

    describe('Low noise', function() {
      beforeEach('initialise state', function() {
        hl = instance.init();
      });

      afterEach('destroy state', function() {
        hl = null;
      });

      is = 'highlights query set from XPath representation with noise';
      it(is, function() {
        hl.add('test-the', ['the']);
        ops.highlight('standard');
        attest.totalHighlights(counts.the + 1, 2);
      });

      is = 'highlights two query sets from XPath representations with noise';
      it(is, function() {
        hl.add('test-the', ['the']);
        ops.highlight('standard');
        ops.highlight('wrapElement');
        attest.totalHighlights(counts.the + 2, 3);
      });

      is = 'highlights three query sets from XPath representations with noise';
      it(is, function() {
        hl.add('test-viber', ['viber']);
        ops.highlight('standard');
        ops.highlight('wrapElement');
        ops.highlight('multiElement');
        attest.totalHighlights(counts.viber + 3, 4);
      });

      is = 'highlights four query sets from XPath representations with noise';
      it(is, function() {
        hl.add('test-viber', ['viber']);
        ops.highlight('standard');
        ops.highlight('wrapElement');
        ops.highlight('multiElement');
        ops.highlight('bottomup');
        attest.totalHighlights(counts.viber + 4, 5);
      });
    });

    describe('Duplicate and noise', function() {
      beforeEach('initialise state', function() {
        hl = instance.init();
      });

      afterEach('destroy state', function() {
        hl = null;
      });

      is = 'highlights one query set from XPath representation with noise';
      it(is, function() {
        hl.add('test-the', ['the']);
        ops.highlight('standard');
        attest.totalHighlights(counts.the + 1, 2);

        hl.add('test-the-2', ['the']);
        ops.highlight('standard', 'standard-2');
        attest.totalHighlights((counts.the + 1) << 1, 4);
      });

      is = 'highlights two query sets from XPath representations with noise';
      it(is, function() {
        hl.add('test-viber', ['viber']);
        ops.highlight('standard');
        ops.highlight('wrapElement');
        attest.totalHighlights(counts.viber + 2, 3);

        hl.add('test-viber-2', ['viber']);
        ops.highlight('standard', 'standard-2');
        ops.highlight('wrapElement', 'wrapElement-2');
        attest.totalHighlights((counts.viber + 2) << 1, 6);
      });

      is = 'highlights three query sets from XPath representations with noise';
      it(is, function() {
        hl.add('test-viber', ['viber']);
        ops.highlight('standard');
        ops.highlight('wrapElement');
        ops.highlight('multiElement');
        attest.totalHighlights(counts.viber + 3, 4);

        hl.add('test-viber-2', ['viber']);
        ops.highlight('standard', 'standard-2');
        ops.highlight('wrapElement', 'wrapElement-2');
        ops.highlight('multiElement', 'multiElement-2');
        attest.totalHighlights((counts.viber + 3) << 1, 8);
      });

      is = 'highlights four query sets from XPath representations with noise';
      it(is, function() {
        hl.add('test-viber', ['viber']);
        ops.highlight('standard');
        ops.highlight('wrapElement');
        ops.highlight('multiElement');
        ops.highlight('bottomup');
        attest.totalHighlights(counts.viber + 4, 5);

        hl.add('test-viber-2', ['viber']);
        ops.highlight('standard', 'standard-2');
        ops.highlight('wrapElement', 'wrapElement-2');
        ops.highlight('multiElement', 'multiElement-2');
        ops.highlight('bottomup', 'bottomup-2');
        attest.totalHighlights((counts.viber + 4) << 1, 10);
      });
    });

    describe('Dense noise', function() {
      beforeEach('initialise state', function() {
        hl = instance.init();
      });

      afterEach('destroy state', function() {
        hl = null;
      });

      is = 'highlights one query set from XPath representation after dense query set add';
      it(is, function() {
        hl
          .add('test-the', ['the'])
          .add('test-viber', ['viber'])
          .add('test-a', ['a']);
        attest.totalHighlights(counts.the + counts.viber + counts.a, 3);

        ops.highlight('standard');
        attest.totalHighlights(counts.the + counts.viber + counts.a + 1, 4);
      });

      is = 'highlights two query sets from XPath representation after dense query set add';
      it(is, function() {
        hl
          .add('test-the', ['the'])
          .add('test-viber', ['viber'])
          .add('test-a', ['a']);
        attest.totalHighlights(counts.the + counts.viber + counts.a, 3);

        ops.highlight('standard');
        ops.highlight('wrapElement');
        attest.totalHighlights(counts.the + counts.viber + counts.a + 2, 5);
      });

      is = 'highlights three query sets from XPath representation after dense query set add';
      it(is, function() {
        hl
          .add('test-the', ['the'])
          .add('test-viber', ['viber'])
          .add('test-a', ['a']);
        attest.totalHighlights(counts.the + counts.viber + counts.a, 3);

        ops.highlight('standard');
        ops.highlight('wrapElement');
        ops.highlight('multiElement');
        attest.totalHighlights(counts.the + counts.viber + counts.a + 3, 6);
      });

      is = 'highlights four query sets from XPath representation after dense query set add';
      it(is, function() {
        hl
          .add('test-the', ['the'])
          .add('test-viber', ['viber'])
          .add('test-a', ['a']);
        attest.totalHighlights(counts.the + counts.viber + counts.a, 3);

        ops.highlight('standard');
        ops.highlight('wrapElement');
        ops.highlight('multiElement');
        ops.highlight('bottomup');
        attest.totalHighlights(counts.the + counts.viber + counts.a + 4, 7);
      });
    });
  });

  describe('Special character handling', function() {
    it('creates a highlight encompassing an ampersand', function() {
      hl = instance.init(1);
      ops.highlight('wampersand-n');
      attest.totalHighlights(1, 1);

      hl = instance.init(2);
      ops.highlight('wampersand-&');
      attest.totalHighlights(1, 1);

      hl = instance.init(3);
      ops.highlight('wampersand-&');
      attest.totalHighlights(1, 1);
    });

    it('creates a highlight starting at an ampersand', function() {
      hl = instance.init(1);
      ops.highlight('sampersand-n');
      attest.totalHighlights(1, 1);

      hl = instance.init(2);
      ops.highlight('sampersand-&');
      attest.totalHighlights(1, 1);

      hl = instance.init(3);
      ops.highlight('sampersand-&');
      attest.totalHighlights(1, 1);
    });

    it('creates a highlight ending at an ampersand', function() {
      hl = instance.init(1);
      ops.highlight('eampersand-n');
      attest.totalHighlights(1, 1);

      hl = instance.init(2);
      ops.highlight('eampersand-&');
      attest.totalHighlights(1, 1);

      hl = instance.init(3);
      ops.highlight('eampersand-&');
      attest.totalHighlights(1, 1);
    });
  });
});
