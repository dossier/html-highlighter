/**
 * @file HTML Highlighter test specifications.
 * @copyright 2015 Diffeo
 *
 * Comments:
 *
 */


(function (factory, window) {
  window.define([ 'jquery', 'html_highlighter', 'data' ], function ($, hh, data) {
    return factory(window, $, hh, data);
  } );
})( function (window, $, hh, data, undefined) {
  /* Module-related & convenience references. */
  var assert = chai.assert,
      expect = chai.expect;

  /* Constants */
  var COUNT_THE = 46,
      COUNT_VIBER = 22,
      COUNT_A = 285;

  /* Attributes */
  var $container = $('#container'),
      $document = $('#document'),
      $entities = $('#entities'),
      $cursor = $('#stats-current'),
      $total = $('#stats-total'),
      hl;

  /* Functions */
  var options = function ()
  {
    return {
      container: $document,
      widget: $('#widget'),
      maxHighlight: 100
    };
  };

  var init = function (reset /* = true */)
  {
    if(reset !== false) $document.html(data);
    hl = new hh.HtmlHighlighter(options());
    assertUi();
  };

  var assertUi = function ()
  {
    if(hl.stats.queries === 0)
      assert.strictEqual(hl.stats.total, 0, 'no hits since no queries exist');

    var cur = cursor(),
        tot = total();

    assert.lengthOf($cursor.text(), cur.toString().length,
                   'cursor string is same length as integer');
    assert.equal(cur, cur.toString(),
                 'cursor is same coerced value');

    assert.lengthOf($total.text(), tot.toString().length,
                   'total string is same length as integer');
    assert.equal(tot, tot.toString(),
                 'total is same coerced value');

    /* By default, if there are highlights then we should expect to find the
     * same number of highlight containers in the document; or 0,
     * conversely. */
    if(tot > 0) assertEnables();
    else        assertDisables();
  };

  var assertClear = function ()
  {
    assert.strictEqual($document.find('.hh-highlight').length, 0,
                      'there are no highlights');
  };

  var assertEnables = function ()
  {
    assert.strictEqual(
      dedup($document.find('.hh-highlight:not(.hh-disabled)')).length,
      total(),
      'there are enabled highlights'
    );
  };

  var assertDisables = function ()
  {
    assert.strictEqual(
      $document.find('.hh-highlight.hh-disabled').length, 0,
      'there are NO enabled highlights'
    );
  };

  var assertSelectionRange = function (range)
  {
    assert.isNotNull(range, 'have selection range');
    assert.isObject(range);
    assert.isFunction(range.computeXpath);

    var xpath = range.computeXpath();
    assert.isObject(xpath);
    assert.property(xpath, 'start', 'xpath has valid structure');
    assert.deepProperty(xpath, 'start.xpath', 'xpath has valid structure');
    assert.deepProperty(xpath, 'start.offset', 'xpath has valid structure');
    assert.property(xpath, 'end', 'xpath has valid structure');
    assert.deepProperty(xpath, 'end.xpath', 'xpath has valid structure');
    assert.deepProperty(xpath, 'end.offset', 'xpath has valid structure');
  };

  var assertHighlight = function (id, length)
  {
    var l = 0;
    $('.hh-highlight-id-' + id).each(function () { l += lengthOf(this); } );
    assert.strictEqual(length, l, 'expected highlight length');
  };

  var assertCursor = function (id, text)
  {
    var enabled = $('.hh-highlight.hh-enabled');
    assert.isAbove(enabled.length, 0, 'there is an active highlight');
    if(enabled.length === 0) return;

    assert.equal(highlightId(enabled.get(0)), id);
    assert.strictEqual(enabled.eq(0).text(), text);
  };

  var highlightId = function (cl)
  {
    return cl.className.match(/hh-highlight-id-(\d+)/)[1];
  };

  var dedup = function (arr)
  {
    var seen = { },
        result = [ ];

    for(var i = 0, l = arr.length; i < l; ++i) {
      var j = highlightId(arr[i]);

      if(seen[j] !== true) {
        seen[j] = true;
        result.push(j);
      }
    }

    return result;
  };

  var cursor = function ()
  {
    var v = $cursor.text();
    return v === '-' ? 0 : parseInt(v);
  };

  var total = function ()
  {
    return parseInt($total.text());
  };

  var select = function (sn, so, en, eo)
  {
    var result,
        range = window.document.createRange(),
        sel = window.getSelection();

    if(!sel) throw 'Unsupported: window.getSelection';

    $container.css('display', 'block');
    hl.clearSelectedRange();

    range.setStart(sn, so);
    range.setEnd(en, eo);

    sel.removeAllRanges();
    sel.addRange(range);

    result = hl.getSelectedRange();
    $container.css('display', 'none');

    return result;
  };

  var firstTextOf = function (node)
  {
    if(node.nodeType === 3) return node;

    for(var i = 0, l = node.childNodes.length; i < l; ++i) {
      node = firstTextOf(node.childNodes[i]);
      if(node !== null) return node;
    }

    return null;
  };

  var lastTextOf = function (node)
  {
    if(node.nodeType === 3) return node;

    for(var i = node.childNodes.length - 1; i >= 0; --i) {
      node = firstTextOf(node.childNodes[i]);
      if(node !== null) return node;
    }

    return null;
  };

  var lengthOf = function (node)
  {
    if(node.nodeType === 3) return node.nodeValue.length;

    var length = 0;
    for(var i = 0, l = node.childNodes.length; i < l; ++i)
      length += lengthOf(node.childNodes[i]);

    return length;
  };

  var selectStandard = function ()
  {
    var result,
        p = $document.find('p:eq(2)').get(0),
        ft = firstTextOf(p),
        lt = lastTextOf(p);

    assert.isAbove(p.childNodes.length, 1, 'length of second paragraph');
    assert.isNotNull(ft, 'has first text node');
    assert.isNotNull(lt, 'has last text node');

    result = select(ft, 0, lt, lt.nodeValue.length);
    assertSelectionRange(result);

    expect(result.computeXpath())
      .to.deep.equal({ end: { offset: 260, xpath: "/p[3]/text()[1]" },
                       start: { offset: 1, xpath: "/p[3]/a/text()[1]" } });
    return result;
  };

  var highlightStandard = function ()
  {
    hl.add('test-1', [ {
      end: { offset: 260, xpath: "/p[3]/text()[1]" },
      start: { offset: 1, xpath: "/p[3]/a/text()[1]" }
    } ] );

    assertHighlight(hh.HtmlRangeHighlighter.id - 1, 265);
  };


  /* Test specifications */
  describe('HTML Highlighter', function() {

    describe('General', function () {
      beforeEach('initialise state', function () {
        init(true);
        assert.strictEqual(total(), 0);
        assert.strictEqual(cursor(), 0);
      } );

      it('initialises', function () { } );

      it('resets UI state after second initialisation', function () {
        assert.strictEqual($cursor.text(), '-', 'no valid cursor');
        assert.strictEqual($total.text(), '0', 'no query sets');
      } );

      it('adds a query set', function () {
        hl.add('test-the', [ 'the' ]);
        assertUi();
        assert.strictEqual(hl.stats.total, COUNT_THE);
      } );

      it('does not allow duplicate query sets', function () {
        hl.add('test-the', [ 'the' ]);
        hl.add('test-the', [ 'the' ]);
        assertUi();
        assert.strictEqual(hl.stats.total, COUNT_THE);
      } );

      it('removes query set when only one exists', function () {
        hl.add('test-the', [ 'the' ]);
        assertUi();
        assert.strictEqual(hl.stats.total, COUNT_THE);
        hl.remove('test-the');
        assertUi();
        assert.strictEqual(hl.stats.total, 0);
        assertClear();
      } );

      it('removes correct query set when multiple queries exist', function () {
        hl.add('test-the', [ 'the' ]);
        assertUi();
        assert.strictEqual(hl.stats.total, COUNT_THE);

        hl.add('test-viber', [ 'viber' ]);
        assertUi();
        assert.strictEqual(hl.stats.total, COUNT_THE + COUNT_VIBER);

        hl.remove('test-the');
        assertUi();
        assert.strictEqual(hl.stats.total, COUNT_VIBER);
      } );

      it('removes all query sets when multiple queries exist', function () {
        hl.add('test-the', [ 'the' ]);
        assertUi();
        assert.strictEqual(hl.stats.total, COUNT_THE);

        hl.add('test-viber', [ 'viber' ]);
        assertUi();
        assert.strictEqual(hl.stats.total, COUNT_THE + COUNT_VIBER);

        hl.remove('test-the');
        assertUi();
        assert.strictEqual(hl.stats.total, COUNT_VIBER);

        hl.remove('test-viber');
        assertUi();
        assert.strictEqual(hl.stats.total, 0);
        assertClear();
      } );

      it('clears state when only one query set exists', function () {
        hl.add('test-the', [ 'the' ]);
        assertUi();
        assert.strictEqual(hl.stats.total, COUNT_THE);

        hl.clear();
        assertUi();
        assert.strictEqual(hl.stats.total, 0);
        assertClear();
      } );

      it('clears state when multiple query sets exist', function () {
        hl.add('test-the', [ 'the' ]);
        assertUi();
        assert.strictEqual(hl.stats.total, COUNT_THE);

        hl.add('test-viber', [ 'viber' ]);
        assertUi();
        assert.strictEqual(hl.stats.total, COUNT_THE + COUNT_VIBER);

        hl.clear();
        assertUi();
        assert.strictEqual(hl.stats.total, 0);
        assertClear();
      } );

      it('moves cursor to next element within query set', function () {
        hl.add('test-the', [ 'the' ]);
        assertUi();
        assert.strictEqual(hl.stats.total, COUNT_THE);

        hl.add('test-viber', [ 'viber' ]);
        assertUi();
        assert.strictEqual(hl.stats.total, COUNT_THE + COUNT_VIBER);

        assert.strictEqual(cursor(), 1);
        hl.next();
        assert.strictEqual(cursor(), 2);
      } );

      it('moves cursor to previous element within query set', function () {
        hl.add('test-the', [ 'the' ]);
        assertUi();
        assert.strictEqual(hl.stats.total, COUNT_THE);

        hl.add('test-viber', [ 'viber' ]);
        assertUi();
        assert.strictEqual(hl.stats.total, COUNT_THE + COUNT_VIBER);

        assert.strictEqual(cursor(), 1);
        hl.next();
        assert.strictEqual(cursor(), 2);
        hl.prev();
        assert.strictEqual(cursor(), 1);
      } );

      it('moves cursor to next element in next query set', function () {
        var id = hh.HtmlRangeHighlighter.id;

        hl.add('test-the', [ 'the' ]);
        assertUi();
        assert.strictEqual(hl.stats.total, COUNT_THE);

        hl.add('test-viber', [ 'viber' ]);
        assertUi();
        assert.strictEqual(hl.stats.total, COUNT_THE + COUNT_VIBER);

        for(var i = 0; i < COUNT_THE; ++i) {
          assert.strictEqual(cursor(), i + 1);
          hl.next();
        }

        assert.strictEqual(cursor(), COUNT_THE + 1);
        assertCursor(COUNT_THE + id, 'Viber');
      } );

      it('moves cursor to previous element in previous query set', function () {
        var id = hh.HtmlRangeHighlighter.id;

        hl.add('test-the', [ 'the' ]);
        assertUi();
        assert.strictEqual(hl.stats.total, COUNT_THE);

        hl.add('test-viber', [ 'viber' ]);
        assertUi();
        assert.strictEqual(hl.stats.total, COUNT_THE + COUNT_VIBER);

        for(var i = 0; i < COUNT_THE; ++i) {
          assert.strictEqual(cursor(), i + 1);
          hl.next();
        }

        assert.strictEqual(cursor(), COUNT_THE + 1);
        assertCursor(COUNT_THE + id, 'Viber');

        hl.prev();
        assert.strictEqual(cursor(), COUNT_THE);
        assertCursor(COUNT_THE + id - 1, 'the');
      } );

      it('moves cursor to last element in last query set', function () {
        var id = hh.HtmlRangeHighlighter.id;

        hl.add('test-the', [ 'the' ]);
        assertUi();
        assert.strictEqual(hl.stats.total, COUNT_THE);

        hl.add('test-viber', [ 'viber' ]);
        assertUi();
        assert.strictEqual(hl.stats.total, COUNT_THE + COUNT_VIBER);

        assert.strictEqual(cursor(), 1);
        hl.prev();
        assert.strictEqual(cursor(), COUNT_THE + COUNT_VIBER);
        assertCursor(COUNT_THE + COUNT_VIBER + id - 1, 'Viber');
      } );

      it('moves cursor to first element in first query set', function () {
        var id = hh.HtmlRangeHighlighter.id;

        hl.add('test-the', [ 'the' ]);
        assertUi();
        assert.strictEqual(hl.stats.total, COUNT_THE);

        hl.add('test-viber', [ 'viber' ]);
        assertUi();
        assert.strictEqual(hl.stats.total, COUNT_THE + COUNT_VIBER);

        assert.strictEqual(cursor(), 1);
        hl.prev();
        assert.strictEqual(cursor(), COUNT_THE + COUNT_VIBER);
        assertCursor(COUNT_THE + COUNT_VIBER + id - 1, 'Viber');

        hl.next();
        assert.strictEqual(cursor(), 1);
        assertCursor(id, 'the');
      } );
    } );

    describe('Text selection', function () {
      before('initialise state', function () {
        init(true);
      } );

      beforeEach('ensure state is valid', function() {
        assertUi();
      });

      it('correctly selects text from virgin state', function() {
        selectStandard();
      });

      it('correctly selects text after single query set add', function() {
        hl.add('test-the', [ 'the' ]);
        assertUi();
        assert.strictEqual(hl.stats.total, COUNT_THE);
        selectStandard();
      });

      it('correctly selects text after second query set add', function() {
        hl.add('test-viber', [ 'viber' ]);
        assertUi();
        assert.strictEqual(hl.stats.total, COUNT_THE + COUNT_VIBER);
        selectStandard();
      });

      it('correctly selects text after dense query set add', function() {
        hl.add('test-a', [ 'a' ]);
        assertUi();
        assert.strictEqual(hl.stats.total, COUNT_THE + COUNT_VIBER + COUNT_A);
        selectStandard();
      });
    });

    describe('XPath', function () {
      before('initialise state', function() {
        init(true);
      });

      beforeEach('ensure state is valid', function () {
        assertUi();
      } );

      it('highlights query set from XPath representation when no'
         + ' other query sets exist', function () {
        highlightStandard();
      } );

      it('highlights query set from XPath representation after single query set '
         + 'add', function () {
        hl.add('test-the', [ 'the' ]);
        assertUi();
        assert.strictEqual(hl.stats.total, COUNT_THE + 1);
        highlightStandard();
      } );

      it('highlights query set from XPath representation after second query set '
         + 'add', function () {
        hl.add('test-the', [ 'the' ]);
        assertUi();
        assert.strictEqual(hl.stats.total, COUNT_THE + 1);
        hl.add('test-viber', [ 'viber' ]);
        assertUi();
        assert.strictEqual(hl.stats.total, COUNT_THE + COUNT_VIBER + 1);
        highlightStandard();
      } );

      it('manually resets previous query sets', function () {
        hl.remove('test-the');
        assertUi();
        assert.strictEqual(hl.stats.total, COUNT_VIBER + 1);

        hl.remove('test-viber');
        assertUi();
        assert.strictEqual(hl.stats.total, 1);

        hl.remove('test-1');
        assertUi();
        assert.strictEqual(hl.stats.total, 0);
      } );

      it('highlights query set from XPath representation after dense query set '
         + 'add', function () {
        hl.add('test-the', [ 'the' ]);
        assertUi();
        assert.strictEqual(hl.stats.total, COUNT_THE);
        hl.add('test-viber', [ 'viber' ]);
        assertUi();
        assert.strictEqual(hl.stats.total, COUNT_THE + COUNT_VIBER);
        hl.add('test-a', [ 'a' ]);
        assertUi();
        assert.strictEqual(hl.stats.total, COUNT_THE + COUNT_VIBER + COUNT_A);
        highlightStandard();
      } );
    } );
  });
}, window);