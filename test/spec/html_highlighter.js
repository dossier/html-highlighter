/**
 * @file HTML Highlighter test specifications.
 * @copyright 2015 Diffeo
 *
 * Comments:
 *
 */


window.define([ 'jquery', 'html_highlighter', 'data' ], function ($, hh, data) {
  /* Module-related & convenience references. */
  var assert = chai.assert;

  /* Constants */
  var COUNT_THE = 46,
      COUNT_VIBER = 22;

  /* Attributes */
  var $document = $('#document'),
      $entities = $('#entities'),
      $cursor = $('#search-current'),
      $total = $('#search-total'),
      hl;

  /* Functions */
  var options = function () {
    return {
      container: $document,
      widget: $('#widget'),
      maxHighlight: 100
    };
  };

  var init = function (reset /* = true */) {
    if(reset !== false) $document.html(data);
    hl = new hh.HtmlHighlighter(options());
    assertUi();
  };

  var assertUi = function () {
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

  var assertClear = function () {
    assert.strictEqual($document.find('.hh-highlight').length, 0,
                      'there are no highlights');
  };

  var assertEnables = function () {
    assert.strictEqual(
      $document.find('.hh-highlight:not(.hh-disabled)').length,
      total(),
      'there are enabled highlights'
    );
  };

  var assertDisables = function () {
    assert.strictEqual(
      $document.find('.hh-highlight.hh-disabled').length, 0,
      'there are NO enabled highlights'
    );
  };

  var cursor = function () {
    var v = $cursor.text();
    return v === '-' ? 0 : parseInt(v);
  };

  var total = function () {
    return parseInt($total.text());
  };

  /* Test specifications */
  describe('HTML Highlighter', function() {

    describe('Basic', function () {
      beforeEach('initialise state', function () {
        init(true);
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
    } );

    describe('XPath', function () {
      beforeEach('instantiate HTML Highlighter without resetting document',
                 function() {
        init(false);
      });

      it('is true', function() {
        assert.ok(true);
      });
    });
  });
});