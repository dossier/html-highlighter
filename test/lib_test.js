/* global describe, beforeEach, it */
require("./bootstrap");

const chai = require("chai");
const expect = chai.expect;
const assert = chai.assert;

const $ = require("jquery");
const htmlTpl = require("./html/templates.html");
const htmlUi = require("./html/ui.html");
$(document.body).append(htmlTpl);
$(document.body).append(htmlUi);

const hh = require("../src/main.js");
const dataFiles = [
  "viber_attacked_by_syrian_electronic_army-cropped.json",
  "one_paragraph-ampersand_nonexistent.json",
  "one_paragraph-ampersand.json",
  "one_paragraph-ampersand_escaped.json"
];

/* eslint-disable global-require */
const data = dataFiles.map((d) => require("../etc/data/" + d).html);
/* eslint-enable global-require */

/* Constants */
const COUNT_THE = 46;
const COUNT_VIBER = 22;
const COUNT_A = 285;

/* Attributes */
const $container = $('#container');
const $document = $('#document');
const $cursor = $('#stats-current');
const $total = $('#stats-total');
var hl;

/* Tests */
var tests = {
  standard: {
    text: "Viber has now clarified that the hack only allowed access to two"
      + " minor systems, a customer support panel and a support"
      + " administration system. According to the company’s official"
      + " response, “no sensitive user data was exposed and Viber’s databases"
      + " were not ‘hacked’.”",
    xpath: {
      start: {offset: 0, xpath: "/p[3]/a/text()[1]"},
      end: {offset: 260, xpath: "/p[3]/text()[1]"}
    }
  },
  wrapElement: {
    text: "the Viber support page, though",
    xpath: {
      start: {xpath: "/p[2]/text()[1]", offset: 47},
      end:   {xpath: "/p[2]/text()[2]:8", offset: 8}
    }
  },
  multiElement: {
    text: "dashboard, not a database. Viber also took the opportunity to"
      + " respond to accusations of spying:Viber, like many other companies"
      + " such as Microsoft, Cisco, Google, and Intel maintains a development"
      + " center in Israel. It seems like this caused some people to come up"
      + " with some pretty bizarre conspiracy theories.It goes without"
      + " saying, that these claims are completely without merit, and have no"
      + " basis in reality whatsoever.Viber is a free messaging and calling"
      + " service based out of London, with development centers in Israel,"
      + " with over 200 million users globally.Update — Viber has followed up"
      + " with more details",
    xpath: {
      start: {xpath: "/p[10]/text()[1]",         offset: 337},
      end:   {xpath: "/p[13]/strong/text()[1]:", offset: 48}
    }
  },
  bottomup: {
    text: " support page, though it",
    xpath: {
      start: {xpath: "/p[2]/a[2]/text()", offset: 5},
      end:   {xpath: "/p[2]/text()[2]",   offset: 11}
    }
  },
  uppercase: {
    text: "Spot originally",
    xpath: {
      start: {xpath: "/P[2]/A/TEXT()[1]", offset: 5},
      end:   {xpath: "/P[2]/TEXT()[1]",   offset: 11}
    }
  },
  "wampersand-&": {
    text: "Army (a pro-government group of computer hackers aligned with"
      + " Syrian President Bashar al-Assad) & the world cried foul",
    xpath: {
      start: {xpath: "/p[1]/code[1]/text()[1]", offset: 18},
      end:   {xpath: "/p[1]/text()[4]",         offset: 114}
    }
  },
  "sampersand-&": {
    text: "& the world cried foul",
    xpath: {
      start: {xpath: "/p[1]/text()[4]", offset: 92},
      end:   {xpath: "/p[1]/text()[4]", offset: 114}
    }
  },
  "eampersand-&": {
    text: "Army (a pro-government group of computer hackers aligned with"
      + " Syrian President Bashar al-Assad) &",
    xpath: {
      start: {xpath: "/p[1]/code[1]/text()[1]", offset: 18},
      end:   {xpath: "/p[1]/text()[4]",         offset: 93}
    }
  },
  "wampersand-n": {
    text: "Army (a pro-government group of computer hackers aligned with"
      + " Syrian President Bashar al-Assad) n the world cried foul",
    xpath: {
      start: {xpath: "/p[1]/code[1]/text()[1]", offset: 18},
      end:   {xpath: "/p[1]/text()[4]",         offset: 114}
    }
  },
  "sampersand-n": {
    text: "n the world cried foul",
    xpath: {
      start: {xpath: "/p[1]/text()[4]", offset: 92},
      end:   {xpath: "/p[1]/text()[4]", offset: 114}
    }
  },
  "eampersand-n": {
    text: "Army (a pro-government group of computer hackers aligned with"
      + " Syrian President Bashar al-Assad) n",
    xpath: {
      start: {xpath: "/p[1]/code[1]/text()[1]", offset: 18},
      end:   {xpath: "/p[1]/text()[4]",         offset: 93}
    }
  }
};

/* Functions */
var options = function()
{
  return {
    container: $document,
    widget: $('#widget'),
    maxHighlight: 100
  };
};

var init = function(ndx)
{
  $document.html(data[ndx || 0]);
  hl = new hh.HtmlHighlighter(options());
  assertUi();
};

var assertUi = function()
{
  if(hl.stats.queries === 0)
    assert.strictEqual(hl.stats.total, 0, 'no hits since no queries exist');

  const cur = cursor();
  const tot = total();

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

var assertClear = function()
{
  assert.strictEqual($document.find('.hh-highlight').length, 0,
                     'there are no highlights');
};

var assertEnables = function()
{
  assert.strictEqual(
    dedup($document.find('.hh-highlight:not(.hh-disabled)')).length,
    total(),
    'there are enabled highlights'
  );
};

var assertDisables = function()
{
  assert.strictEqual(
    $document.find('.hh-highlight.hh-disabled').length, 0,
    'there are NO enabled highlights'
  );
};

var assertSelectionRange = function(range)
{
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
};

var assertCursor = function(id, text)
{
  const enabled = $('.hh-highlight.hh-enabled');
  assert.isAbove(enabled.length, 0, 'there is an active highlight');
  if(enabled.length === 0) return;

  assert.equal(highlightId(enabled.get(0)), id);
  assert.strictEqual(enabled.eq(0).text(), text);
};

var highlightId = function(cl)
{
  return cl.className.match(/hh-highlight-id-(\d+)/)[1];
};

var dedup = function(arr)
{
  let seen = {},
      result = [];

  for(let i = 0, l = arr.length; i < l; ++i) {
    const j = highlightId(arr[i]);

    if(seen[j] !== true) {
      seen[j] = true;
      result.push(j);
    }
  }

  return result;
};

var cursor = function()
{
  const v = $cursor.text();
  return v === '-' ? 0 : parseInt(v);
};

var total = function()
{
  return parseInt($total.text());
};

var select = function(sn, so, en, eo)
{
  let result;
  let range = window.document.createRange(),
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

var firstTextOf = function(node)
{
  if(node.nodeType === 3) return node;

  for(let i = 0, l = node.childNodes.length; i < l; ++i) {
    node = firstTextOf(node.childNodes[i]);
    if(node !== null) return node;
  }

  return null;
};

var lastTextOf = function(node)
{
  if(node.nodeType === 3) return node;

  for(let i = node.childNodes.length - 1; i >= 0; --i) {
    node = firstTextOf(node.childNodes[i]);
    if(node !== null) return node;
  }

  return null;
};

var lengthOf = function(node)
{
  if(node.nodeType === 3) return node.nodeValue.length;

  let length = 0;
  for(let i = 0, l = node.childNodes.length; i < l; ++i) {
    length += lengthOf(node.childNodes[i]);
  }

  return length;
};

var textOf = function(node)
{
  if(node.nodeType === 3) return node.nodeValue;

  let text = '';
  for(let i = 0, l = node.childNodes.length; i < l; ++i) {
    text += textOf(node.childNodes[i]);
  }

  return text;
};

var selectStandard = function()
{
  const p = $document.find('p:eq(2)').get(0);
  const ft = firstTextOf(p);
  const lt = lastTextOf(p);
  let result;

  assert.isAbove(p.childNodes.length, 1, 'length of second paragraph');
  assert.isNotNull(ft, 'has first text node');
  assert.isNotNull(lt, 'has last text node');

  result = select(ft, 0, lt, lt.nodeValue.length);
  assertSelectionRange(result);

  expect(result.computeXpath())
    .to.deep.equal({end: {offset: 260, xpath: "/p[3]/text()[1]"},
                    start: {offset: 0, xpath: "/p[3]/a[1]/text()[1]"}});
  return result;
};

var highlight = function(name, qsetname)
{
  if(qsetname === undefined) qsetname = name;
  hl.add('test-' + qsetname, [tests[name].xpath]).apply();
  assertHighlight(hl.lastId - 1, tests[name].text);
};

var assertHighlight = function(id, text)
{
  let l = 0, t = '';
  $('.hh-highlight-id-' + id).each(function() {
    l += lengthOf(this); t += textOf(this);
  });

  assert.strictEqual(text, t, 'expected highlight text');
  assert.strictEqual(text.length, l, 'expected highlight length');
  assertUi();
};


/* Test specifications */
describe('HTML Highlighter', function() {

  describe('General', function() {
    beforeEach('initialise state', function() {
      init();
      assert.strictEqual(total(), 0);
      assert.strictEqual(cursor(), 0);
    });

    it('initialises', function() {});

    it('resets UI state after second initialisation', function() {
      assert.strictEqual($cursor.text(), '-', 'no valid cursor');
      assert.strictEqual($total.text(), '0', 'no query sets');
    });

    it('adds a query set with a single mention', function() {
      hl.add('test-the', ['the']).apply();
      assertUi();
      assert.strictEqual(hl.stats.total, COUNT_THE);
    });

    it('adds a query set with multiple mentions', function() {
      const id = hl.lastId;
      hl.add('test-the-viber', ['the', 'viber']).apply();
      assertUi();
      assert.strictEqual(hl.stats.total, COUNT_THE + COUNT_VIBER);
      assert.strictEqual(hl.lastId, COUNT_THE + COUNT_VIBER + id);
    });

    it('does not allow duplicate query sets - I', function() {
      hl.add('test-the', ['the'])
        .add('test-the', ["the"])
        .apply();
      assertUi();
      assert.strictEqual(hl.stats.total, COUNT_THE);
      assert.strictEqual(hl.stats.queries, 1);
    });

    it('does not allow duplicate query sets - II', function() {
      hl.add('test-the', ['the']).apply();
      assertUi();
      assert.strictEqual(hl.stats.total, COUNT_THE);

      hl.add('test-the', ['the']).apply();
      assertUi();
      assert.strictEqual(hl.stats.total, COUNT_THE);
      assert.strictEqual(hl.stats.queries, 1);
    });

    it('does not allow duplicate query sets - III', function() {
      hl.add('test-the', ['the'])
        .add('test-the', ['the'])
        .apply();
      assertUi();
      assert.strictEqual(hl.stats.total, COUNT_THE);

      hl.add('test-the', ['the']).apply();
      assertUi();
      assert.strictEqual(hl.stats.total, COUNT_THE);
      assert.strictEqual(hl.stats.queries, 1);
    });

    it('removes query set when only one exists', function() {
      hl.add('test-the', ['the']).apply();
      assertUi();
      assert.strictEqual(hl.stats.total, COUNT_THE);
      hl.remove('test-the').apply();
      assertUi();
      assert.strictEqual(hl.stats.total, 0);
      assert.strictEqual(hl.stats.queries, 0);
      assertClear();
    });

    it('removes correct query set when multiple queries exist', function() {
      hl.add('test-the', ['the']).apply();
      assertUi();
      assert.strictEqual(hl.stats.total, COUNT_THE);
      assert.strictEqual(hl.stats.queries, 1);

      hl.add('test-viber', ['viber']).apply();
      assertUi();
      assert.strictEqual(hl.stats.total, COUNT_THE + COUNT_VIBER);
      assert.strictEqual(hl.stats.queries, 2);

      hl.remove('test-the').apply();
      assertUi();
      assert.strictEqual(hl.stats.total, COUNT_VIBER);
      assert.strictEqual(hl.stats.queries, 1);
    });

    it('removes all query sets when multiple queries exist', function() {
      hl.add('test-the', ['the']).apply();
      assertUi();
      assert.strictEqual(hl.stats.total, COUNT_THE);
      assert.strictEqual(hl.stats.queries, 1);

      hl.add('test-viber', ['viber']).apply();
      assertUi();
      assert.strictEqual(hl.stats.total, COUNT_THE + COUNT_VIBER);
      assert.strictEqual(hl.stats.queries, 2);

      hl.remove('test-the').apply();
      assertUi();
      assert.strictEqual(hl.stats.total, COUNT_VIBER);
      assert.strictEqual(hl.stats.queries, 1);

      hl.remove('test-viber').apply();
      assertUi();
      assert.strictEqual(hl.stats.total, 0);
      assert.strictEqual(hl.stats.queries, 0);
      assertClear();
    });

    it('clears state when only one query set exists', function() {
      hl.add('test-the', ['the']).apply();
      assertUi();
      assert.strictEqual(hl.stats.total, COUNT_THE);
      assert.strictEqual(hl.stats.queries, 1);

      hl.clear().apply();
      assertUi();
      assert.strictEqual(hl.stats.total, 0);
      assert.strictEqual(hl.stats.queries, 0);
      assertClear();
    });

    it('clears state when multiple query sets exist', function() {
      hl.add('test-the', ['the']).apply();
      assertUi();
      assert.strictEqual(hl.stats.total, COUNT_THE);
      assert.strictEqual(hl.stats.queries, 1);

      hl.add('test-viber', ['viber']).apply();
      assertUi();
      assert.strictEqual(hl.stats.total, COUNT_THE + COUNT_VIBER);
      assert.strictEqual(hl.stats.queries, 2);

      hl.clear().apply();
      assertUi();
      assert.strictEqual(hl.stats.total, 0);
      assert.strictEqual(hl.stats.queries, 0);
      assertClear();
    });
  });

  describe("Cursor movement", function() {
    beforeEach('initialise state', function() {
      init();
      assert.strictEqual(total(), 0);
      assert.strictEqual(cursor(), 0);
    });

    it('moves cursor to next element', function() {
      hl.add('test-the', ['the']).apply();
      assertUi();
      assert.strictEqual(hl.stats.total, COUNT_THE);
      assert.strictEqual(hl.stats.queries, 1);

      hl.add('test-viber', ['viber']).apply();
      assertUi();
      assert.strictEqual(hl.stats.total, COUNT_THE + COUNT_VIBER);
      assert.strictEqual(hl.stats.queries, 2);

      assert.strictEqual(cursor(), 0);
      hl.next();
      assert.strictEqual(cursor(), 1);
    });

    it('moves cursor to previous element', function() {
      hl.add('test-the', ['the']).apply();
      assertUi();
      assert.strictEqual(hl.stats.total, COUNT_THE);
      assert.strictEqual(hl.stats.queries, 1);

      hl.add('test-viber', ['viber']).apply();
      assertUi();
      assert.strictEqual(hl.stats.total, COUNT_THE + COUNT_VIBER);
      assert.strictEqual(hl.stats.queries, 2);

      assert.strictEqual(cursor(), 0);
      hl.next();
      assert.strictEqual(cursor(), 1);
      hl.next();
      assert.strictEqual(cursor(), 2);
      hl.prev();
      assert.strictEqual(cursor(), 1);
    });

    it('moves cursor to last element', function() {
      hl.add('test-the', ['the']).apply();
      assertUi();
      assert.strictEqual(hl.stats.total, COUNT_THE);
      assert.strictEqual(hl.stats.queries, 1);

      hl.add('test-viber', ['viber']).apply();
      assertUi();
      assert.strictEqual(hl.stats.total, COUNT_THE + COUNT_VIBER);
      assert.strictEqual(hl.stats.queries, 2);

      for(let i = 0; i < COUNT_THE + COUNT_VIBER; ++i) {
        assert.strictEqual(cursor(), i);
        hl.next();
      }

      assert.strictEqual(cursor(), COUNT_THE + COUNT_VIBER);
      //        assertCursor(COUNT_THE + COUNT_VIBER, 'Viber');
    });

    it('cursor rolls over to first element from last', function() {
      hl.add('test-the', ['the']).apply();
      assertUi();
      assert.strictEqual(hl.stats.total, COUNT_THE);
      assert.strictEqual(hl.stats.queries, 1);

      hl.add('test-viber', ['viber']).apply();
      assertUi();
      assert.strictEqual(hl.stats.total, COUNT_THE + COUNT_VIBER);
      assert.strictEqual(hl.stats.queries, 2);

      for(let i = 0; i < COUNT_THE + COUNT_VIBER + 1; ++i) {
        assert.strictEqual(cursor(), i);
        hl.next();
      }

      assert.strictEqual(cursor(), 1);
    });

    it('cursor rolls over to last element from first', function() {
      hl.add('test-the', ['the']).apply();
      assertUi();
      assert.strictEqual(hl.stats.total, COUNT_THE);
      assert.strictEqual(hl.stats.queries, 1);

      hl.add('test-viber', ['viber']).apply();
      assertUi();
      assert.strictEqual(hl.stats.total, COUNT_THE + COUNT_VIBER);
      assert.strictEqual(hl.stats.queries, 2);

      assert.strictEqual(cursor(), 0);
      hl.prev();
      assert.strictEqual(cursor(), COUNT_THE + COUNT_VIBER);
    });

    it('cursor rolls over to last element from first and back', function() {
      hl.add('test-the', ['the']).apply();
      assertUi();
      assert.strictEqual(hl.stats.total, COUNT_THE);
      assert.strictEqual(hl.stats.queries, 1);

      hl.add('test-viber', ['viber']).apply();
      assertUi();
      assert.strictEqual(hl.stats.total, COUNT_THE + COUNT_VIBER);
      assert.strictEqual(hl.stats.queries, 2);

      assert.strictEqual(cursor(), 0);
      hl.prev();
      assert.strictEqual(cursor(), COUNT_THE + COUNT_VIBER);

      hl.next();
      assert.strictEqual(cursor(), 1);
    });

    describe('Iterable queries', function() {
      beforeEach('initialise state', function() {
        init();
        assert.strictEqual(total(), 0);
        assert.strictEqual(cursor(), 0);

        hl.add('test-the', ['the']).apply();
        assertUi();
        assert.strictEqual(hl.stats.total, COUNT_THE);
        assert.strictEqual(hl.stats.queries, 1);

        hl.add('test-viber', ['viber']).apply();
        assertUi();
        assert.strictEqual(hl.stats.total, COUNT_THE + COUNT_VIBER);
        assert.strictEqual(hl.stats.queries, 2);
      });

      it('allows setting of iterable queries', function() {
        hl.setIterableQueries('test-the');
        assert.strictEqual(hl.cursor.total, COUNT_THE);
      });

      it('resets the cursor position', function() {
        hl.setIterableQueries('test-the');
        assert.strictEqual(cursor(), 0);
        hl.next();
        assert.strictEqual(cursor(), 1);

        hl.setIterableQueries('test-viber');
        assert.strictEqual(cursor(), 0);
      });

      it('allows setting of iterable queries multiple times', function() {
        hl.setIterableQueries('test-the');
        assert.strictEqual(hl.cursor.total, COUNT_THE);
        assert.strictEqual(total(), hl.cursor.total);

        hl.setIterableQueries('test-viber');
        assert.strictEqual(hl.cursor.total, COUNT_VIBER);
        assert.strictEqual(total(), hl.cursor.total);

        hl.setIterableQueries(['test-the', 'test-viber']);
        assert.strictEqual(hl.cursor.total, COUNT_THE + COUNT_VIBER);
        assert.strictEqual(total(), hl.cursor.total);
      });

      it('allows unsetting of iterable queries', function() {
        hl.setIterableQueries('test-the');
        assert.strictEqual(hl.cursor.total, COUNT_THE);
        assert.strictEqual(total(), hl.cursor.total);

        hl.setIterableQueries('test-viber');
        assert.strictEqual(hl.cursor.total, COUNT_VIBER);
        assert.strictEqual(total(), hl.cursor.total);

        hl.setIterableQueries(null);
        assert.strictEqual(hl.cursor.total, COUNT_THE + COUNT_VIBER);
        assert.strictEqual(total(), hl.cursor.total);
      });

      it('moves cursor to next element', function() {
        hl.setIterableQueries('test-the');
        assert.strictEqual(hl.cursor.total, COUNT_THE);
        assert.strictEqual(total(), hl.cursor.total);

        assert.strictEqual(cursor(), 0);
        hl.next();
        assert.strictEqual(cursor(), 1);
      });

      it('moves cursor to previous element', function() {
        hl.setIterableQueries('test-the');
        assert.strictEqual(hl.cursor.total, COUNT_THE);
        assert.strictEqual(total(), hl.cursor.total);

        assert.strictEqual(cursor(), 0);
        hl.next();
        assert.strictEqual(cursor(), 1);
        hl.next();
        assert.strictEqual(cursor(), 2);
        hl.prev();
        assert.strictEqual(cursor(), 1);
      });

      it('moves cursor to last element', function() {
        hl.setIterableQueries('test-the');
        assert.strictEqual(hl.cursor.total, COUNT_THE);
        assert.strictEqual(total(), hl.cursor.total);

        for(let i = 0; i < COUNT_THE; ++i) {
          assert.strictEqual(cursor(), i);
          hl.next();
        }

        assert.strictEqual(cursor(), COUNT_THE);
      });

      it('cursor rolls over to first element from last', function() {
        hl.setIterableQueries('test-the');
        assert.strictEqual(hl.cursor.total, COUNT_THE);
        assert.strictEqual(total(), hl.cursor.total);

        for(let i = 0; i < COUNT_THE + 1; ++i) {
          assert.strictEqual(cursor(), i);
          hl.next();
        }

        assert.strictEqual(cursor(), 1);
      });

      it('cursor rolls over to last element from first', function() {
        hl.setIterableQueries('test-the');
        assert.strictEqual(hl.cursor.total, COUNT_THE);
        assert.strictEqual(total(), hl.cursor.total);

        assert.strictEqual(cursor(), 0);
        hl.prev();
        assert.strictEqual(cursor(), COUNT_THE);
      });

      it('cursor rolls over to last element from first and back', function() {
        hl.setIterableQueries('test-the');
        assert.strictEqual(hl.cursor.total, COUNT_THE);
        assert.strictEqual(total(), hl.cursor.total);

        assert.strictEqual(cursor(), 0);
        hl.prev();
        assert.strictEqual(cursor(), COUNT_THE);

        hl.next();
        assert.strictEqual(cursor(), 1);
      });
    });
  });

  describe('Text selection', function() {
    beforeEach('initialise state', function() {
      init();
    });

    it('correctly selects text', function() {
      selectStandard();
    });

    it('correctly selects text after single query set add', function() {
      hl.add('test-the', ['the']).apply();
      assertUi();
      assert.strictEqual(hl.stats.total, COUNT_THE);

      selectStandard();
    });

    it('correctly selects text after second query set add', function() {
      hl.add('test-the', ['the']).apply();
      assertUi();
      hl.add('test-viber', ['viber']).apply();
      assertUi();
      assert.strictEqual(hl.stats.total, COUNT_THE + COUNT_VIBER);

      selectStandard();
    });

    it('correctly selects text after dense query set add', function() {
      hl.add('test-the', ['the']).apply();
      assertUi();
      hl.add('test-viber', ['viber']).apply();
      assertUi();
      hl.add('test-a', ['a']).apply();
      assertUi();
      assert.strictEqual(hl.stats.total, COUNT_THE + COUNT_VIBER + COUNT_A);

      selectStandard();
    });
  });

  describe('XPath', function() {
    describe('Basic', function() {
      beforeEach('initialise state', function() {
        init();
      });

      it('can cope with XPath representations in uppercase', function() {
        highlight('uppercase');
      });

      it('highlights the "standard" query set from XPath representation', function() {
        highlight('standard');
      });

      it('highlights the "wrapElement" query set from XPath representation', function() {
        highlight('wrapElement');
      });

      it('highlights the "multiElement" query set from XPath representation', function() {
        highlight('multiElement');
      });

      it('highlights the "bottomup" query set from XPath representation', function() {
        highlight('bottomup');
      });

      it('highlights one query set from XPath representation', function() {
        highlight('standard');
      });

      it('highlights two query sets from XPath representations', function() {
        highlight('standard');
        highlight('wrapElement');
      });

      it('highlights three query sets from XPath representations', function() {
        highlight('standard');
        highlight('wrapElement');
        highlight('multiElement');
      });

      it('highlights four query sets from XPath representations', function() {
        highlight('standard');
        highlight('wrapElement');
        highlight('multiElement');
        highlight('bottomup');
      });
    });

    describe('Low noise', function() {
      beforeEach('initialise state', function() {
        init();
      });

      it('highlights query set from XPath representation with noise', function() {
        hl.add('test-the', ['the']).apply();
        assertUi();
        assert.strictEqual(hl.stats.total, COUNT_THE);

        highlight('standard');
      });

      it('highlights two query sets from XPath representations with noise', function() {
        hl.add('test-the', ['the']).apply();
        assertUi();
        assert.strictEqual(hl.stats.total, COUNT_THE);

        highlight('standard');
        highlight('wrapElement');
      });

      it('highlights three query sets from XPath representations with noise', function() {
        hl.add('test-viber', ['viber']).apply();
        assertUi();
        assert.strictEqual(hl.stats.total, COUNT_VIBER);

        highlight('standard');
        highlight('wrapElement');
        highlight('multiElement');
      });

      it('highlights four query sets from XPath representations with noise', function() {
        hl.add('test-viber', ['viber']).apply();
        assertUi();
        assert.strictEqual(hl.stats.total, COUNT_VIBER);

        highlight('standard');
        highlight('wrapElement');
        highlight('multiElement');
        highlight('bottomup');
      });
    });

    describe('Duplicate and noise', function() {
      beforeEach('initialise state', function() {
        init();
      });

      it('highlights one query set from XPath representation with noise', function() {
        hl.add('test-the', ['the']).apply();
        assertUi();
        highlight('standard');
        assert.strictEqual(hl.stats.total, COUNT_THE + 1);

        hl.add('test-the-2', ['the']).apply();
        assertUi();
        highlight('standard', 'standard-2');
        assert.strictEqual(hl.stats.total, (COUNT_THE + 1) << 1);
      });

      it('highlights two query sets from XPath representations with noise', function() {
        hl.add('test-viber', ['viber']).apply();
        assertUi();
        highlight('standard');
        highlight('wrapElement');
        assert.strictEqual(hl.stats.total, COUNT_VIBER + 2);

        hl.add('test-viber-2', ['viber']).apply();
        assertUi();

        highlight('standard', 'standard-2');
        highlight('wrapElement', 'wrapElement-2');
        assert.strictEqual(hl.stats.total, (COUNT_VIBER + 2) << 1);
      });

      it('highlights three query sets from XPath representations with noise', function() {
        hl.add('test-viber', ['viber']).apply();
        assertUi();
        highlight('standard');
        highlight('wrapElement');
        highlight('multiElement');
        assert.strictEqual(hl.stats.total, COUNT_VIBER + 3);

        hl.add('test-viber-2', ['viber']).apply();
        assertUi();
        highlight('standard', 'standard-2');
        highlight('wrapElement', 'wrapElement-2');
        highlight('multiElement', 'multiElement-2');
        assert.strictEqual(hl.stats.total, (COUNT_VIBER + 3) << 1);
      });

      it('highlights four query sets from XPath representations with noise', function() {
        hl.add('test-viber', ['viber']).apply();
        assertUi();
        highlight('standard');
        highlight('wrapElement');
        highlight('multiElement');
        highlight('bottomup');
        assert.strictEqual(hl.stats.total, COUNT_VIBER + 4);

        hl.add('test-viber-2', ['viber']).apply();
        assertUi();
        highlight('standard', 'standard-2');
        highlight('wrapElement', 'wrapElement-2');
        highlight('multiElement', 'multiElement-2');
        highlight('bottomup', 'bottomup-2');
        assert.strictEqual(hl.stats.total, (COUNT_VIBER + 4) << 1);
      });
    });

    describe('Dense noise', function() {
      beforeEach('initialise state', function() {
        init();
      });

      it('highlights one query set from XPath representation after dense query set add', function()
         {
        hl.add('test-the', ['the']).apply();
        assertUi();
        assert.strictEqual(hl.stats.total, COUNT_THE);
        hl.add('test-viber', ['viber']).apply();
        assertUi();
        assert.strictEqual(hl.stats.total, COUNT_THE + COUNT_VIBER);
        hl.add('test-a', ['a']).apply();
        assertUi();
        assert.strictEqual(hl.stats.total, COUNT_THE + COUNT_VIBER + COUNT_A);

        highlight('standard');
      });

      it('highlights two query sets from XPath representation after dense query set add', function()
         {
        hl.add('test-the', ['the']).apply();
        assertUi();
        assert.strictEqual(hl.stats.total, COUNT_THE);
        hl.add('test-viber', ['viber']).apply();
        assertUi();
        assert.strictEqual(hl.stats.total, COUNT_THE + COUNT_VIBER);
        hl.add('test-a', ['a']).apply();
        assertUi();
        assert.strictEqual(hl.stats.total, COUNT_THE + COUNT_VIBER + COUNT_A);

        highlight('standard');
        highlight('wrapElement');
      });

      it('highlights three query sets from XPath representation after dense query set add', function()
         {
        hl.add('test-the', ['the']).apply();
        assertUi();
        assert.strictEqual(hl.stats.total, COUNT_THE);
        hl.add('test-viber', ['viber']).apply();
        assertUi();
        assert.strictEqual(hl.stats.total, COUNT_THE + COUNT_VIBER);
        hl.add('test-a', ['a']).apply();
        assertUi();
        assert.strictEqual(hl.stats.total, COUNT_THE + COUNT_VIBER + COUNT_A);

        highlight('standard');
        highlight('wrapElement');
        highlight('multiElement');
      });

      it('highlights four query sets from XPath representation after dense query set add', function()
         {
        hl.add('test-the', ['the']).apply();
        assertUi();
        assert.strictEqual(hl.stats.total, COUNT_THE);
        hl.add('test-viber', ['viber']).apply();
        assertUi();
        assert.strictEqual(hl.stats.total, COUNT_THE + COUNT_VIBER);
        hl.add('test-a', ['a']).apply();
        assertUi();
        assert.strictEqual(hl.stats.total, COUNT_THE + COUNT_VIBER + COUNT_A);

        highlight('standard');
        highlight('wrapElement');
        highlight('multiElement');
        highlight('bottomup');
      });
    });

    describe('Special character handling', function() {
      it('creates a highlight encompassing an ampersand', function() {
        init(1);
        highlight("wampersand-n");

        init(2);
        highlight("wampersand-&");

        init(3);
        highlight("wampersand-&");
      });

      it('creates a highlight starting at an ampersand', function() {
        init(1);
        highlight("sampersand-n");

        init(2);
        highlight("sampersand-&");

        init(3);
        highlight("sampersand-&");
      });

      it('creates a highlight ending at an ampersand', function() {
        init(1);
        highlight("eampersand-n");

        init(2);
        highlight("eampersand-&");

        init(3);
        highlight("eampersand-&");
      });
    });
  });
});