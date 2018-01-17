// @flow
/* eslint-disable camelcase */
import EventEmitter from 'events';

import merge from 'merge';

import * as dom from './dom';
import { Css } from './consts';
import type { InputOptions, Options } from './consts';
import TextContent from './textcontent';
import RangeHighlighter from './rangehighlighter';
import RangeUnhighlighter from './rangeunhighlighter';
import Range from './range';
import Cursor from './cursor';
import * as constructor from './constructor';

export type Stats = {|
  queries: number,
  total: number,
  highlight: number,
|};

export type QuerySet = {|
  name: string,
  enabled: boolean,
  id_highlight: number,
  id: number,
  length: number,
  reserve: number | null,
|};

export type Marker = {|
  query: QuerySet,
  index: number,
  offset: number,
|};

/**
 * Main class of the HTML Highlighter module, which exposes an API enabling
 * clients to control all the features supported related to highlighting and
 * text selection.
 *
 * Emits the following events:
 *
 *  - refresh: text content refreshed
 *  - add: query set added
 *  - append: queries added to query set
 *  - remove: query set removed
 *  - enable: query set enabled
 *  - disable: query set disabled
 *  - clear: all query sets removed and cursor cleared
 * */
class HtmlHighlighter extends EventEmitter {
  options: Options;
  cursor: Cursor;
  stats: Stats;
  lastId: number;
  content: TextContent;
  queries: Map<string, QuerySet>;
  highlights: Array<Marker>;

  /** Static attribute that sets the debug state for methods that don't have access to the
   * `options` descriptor and thus can't query the `debug` attribute. */
  static debug: boolean = false;

  // Default options.  Note that we cannot declare this map as `Options` since not all attributes
  // are defined.
  static defaults: InputOptions = {
    // Sometimes it is useful for the client to determine how to bring an element into view via
    // scrolling. If `scrollTo` is set, then it is called as a function with a `Node` to scroll
    // to.
    scrollTo: null,
    maxHighlight: 1,
    useQueryAsClass: false,
    normalise: true,
  };

  constructor(options: InputOptions) {
    super();

    // Merge default options
    this.options = merge({}, HtmlHighlighter.defaults, options);

    // Mutable properties
    this.queries = new Map();
    this.highlights = [];

    // TODO: rename attribute to something else that makes it clear it refers to the next highlight
    // id.
    this.lastId = 0;

    // TODO: refactor the following map.  In particular, the `highlight` attribute BADLY needs to
    // become a class attribute of its own since it refers to the NEXT query set id.
    this.stats = {
      queries: 0,
      total: 0,
      highlight: 0,
    };

    const { container } = options;
    if (container == null) {
      this.options.container = window.document.body;
    } else if (container instanceof HTMLElement) {
      this.options.container = container;
    }

    this.cursor = new Cursor(this);

    // Start by refreshing the internal document's text representation, which initialises
    // `this.content`.
    this.refresh();
    // console.info("HTML highlighter instantiated");
  }

  /**
   * Refreshes the internal representation of the text.
   *
   * Should only be invoked when the HTML structure mutates.
   */
  refresh() {
    this.content = new TextContent(this.options.container);
    this.assert_();
    this.emit('refresh');
  }

  /**
   * Create a query set by the name and containing one or more queries
   *
   * If the query set already exists, its contents and highlights are firs destroyed and new one
   * created.  Optionally, it is possible to specify a number of highlights to reserve for the
   * query set.
   *
   * Note that, at this point in time, only string queries and XPath representations are supported.
   *
   * @param {string} name - Name of the query set
   * @param {Array<any>} queries - Array containing individual queries to highlight
   * @param {bool} enabled - If explicitly `false`, query set is disabled; otherwise enabled
   * @param {number} [reserve] - Number of highlights to reserve for query set
   *
   * @returns {HtmlHighlighter} Self instance for chaining
   */
  add(
    name: string,
    queries: Array<any>,
    enabled: boolean = true,
    reserve: number | null = null
  ): HtmlHighlighter {
    enabled = enabled === true;
    if (typeof reserve !== 'number' || reserve < 1) {
      reserve = null;
    }

    // Remove query set if it exists
    if (this.queries.has(name)) {
      this.remove(name);
    }

    // TODO: rename `id_highlight` and `id` attributes below.  The former actually refers to the
    // query set id and the latter to the first highlight in the query set.  Should have been
    // refactored long ago!
    const querySet: QuerySet = {
      name,
      enabled,
      id_highlight: this.stats.highlight,
      id: this.lastId,
      length: 0,
      reserve: null,
    };

    this.queries.set(name, querySet);

    const count = this.add_queries_(querySet, queries, enabled);
    if (reserve != null) {
      if (reserve > count) {
        this.lastId = reserve;
        querySet.reserve = reserve;
      } else {
        console.error('Invalid or insufficient reserve specified');
        querySet.reserve = count;
      }
    } else {
      this.lastId += count;
    }

    // Update global statistics
    ++this.stats.queries;

    // Ensure CSS highlight class rolls over on overflow
    ++this.stats.highlight;
    if (this.stats.highlight >= this.options.maxHighlight) {
      this.stats.highlight = 0;
    }

    this.cursor.clear();
    this.assert_();
    this.emit('add', name, querySet, queries);

    return this;
  }

  /**
   * Append one or more queries to an existing query set
   *
   * If the query set doesn't yet exist, an exception is thrown. In addition, the query set
   * **must** have enough reserved space available to contain the new queries.  All queries not
   * fitting in the container are suppressed.
   *
   * @param {string} name - Name of the query set.
   * @param {string[]} queries - Array containing individual queries to highlight.
   * @param {bool} enabled - If explicitly `true`, query set is also enabled.
   *
   * @returns {HtmlHighlighter} Self instance for chaining
   */
  append(name: string, queries: Array<string>, enabled: boolean = false): HtmlHighlighter {
    const querySet = this.queries.get(name);
    if (querySet == null) {
      throw new Error('Invalid or query set not yet created');
    }

    this.add_queries_(querySet, queries, enabled === true);
    this.cursor.clear();
    this.assert_();
    this.emit('append', name, querySet, queries);

    return this;
  }

  /**
   * Remove a query set by name
   *
   * An exception is thrown if the query set does not exist.
   *
   * @param {string} name - Name of the query set to remove.
   * @returns {HtmlHighlighter} Self instance for chaining
   */
  remove(name: string): HtmlHighlighter {
    this.remove_(name);
    this.cursor.clear();
    this.emit('remove', name);
    return this;
  }

  /**
   * Enable a query set
   *
   * An exception is thrown if the query set does not exist.  If the query set is currently already
   * enabled, nothing is done.
   *
   * @param {string} name - Name of the query set to enable.
   * @returns {HtmlHighlighter} Self instance for chaining
   */
  enable(name: string): HtmlHighlighter {
    const q = this.get_(name);
    if (q.enabled || q.id === null) {
      return this;
    }

    const { disabled: cssDisabled } = Css;
    for (let i = q.id, l = i + q.length; i < l; ++i) {
      dom.removeClass(dom.getHighlightElements(i), cssDisabled);
    }

    q.enabled = true;
    this.stats.total += q.length;
    this.cursor.clear();
    this.emit('enable', name);
    return this;
  }

  /**
   * Disable a query set
   *
   * An exception is thrown if the query set does not exist.  If the query set is currently already
   * disabled, nothing is done.
   *
   * @param {string} name - Name of the query set to disable.
   * @returns {HtmlHighlighter} Self instance for chaining
   */
  disable(name: string): HtmlHighlighter {
    const q = this.get_(name);
    if (!q.enabled || q.id === null) {
      return this;
    }

    const { disabled: cssDisabled } = Css;
    for (let i = q.id, l = i + q.length; i < l; ++i) {
      dom.addClass(dom.getHighlightElements(i), cssDisabled);
    }

    q.enabled = false;
    this.stats.total -= q.length;
    this.cursor.clear();
    this.emit('disable', name);
    return this;
  }

  /**
   * Remove all query sets
   *
   * Optionally, the last query set id can be reset.
   *
   * @param {boolean} reset - Last query set id is reset, if `true`.
   * @returns {HtmlHighlighter} Self instance for chaining
   */
  clear(reset: boolean): HtmlHighlighter {
    for (const [name] of this.queries) {
      this.remove_(name);
    }

    // Sanity check
    if (!this.empty()) {
      throw new Error('Query set object not empty');
    }

    if (reset) {
      this.lastId = 0;
      this.stats.highlight = 0;
    }

    this.cursor.clear();
    this.emit('clear');
    return this;
  }

  /**
   * Set the queries that the cursor will visit when the `prev` and `next` methods are invoked
   *
   * If `null`, all queries will be visited.
   *
   * @param {Array} queries - Array containing query set names
   */
  setIterableQueries(queries: Array<string> | null = null): void {
    this.cursor.setIterableQueries(queries);
  }

  /**
   * Move cursor position to the previous query in the active query set
   *
   * If the cursor moves past the first query in the active query set, the active query set moves
   * to the previous available one and the cursor position to its last query.  If the current query
   * set is the first in the collection and thus it is not possible to move to the previous query
   * set, the last query set is made active instead, thus ensuring that the cursor always rolls
   * over.
   */
  prev(): void {
    this.cursor.prev();
  }

  /**
   * Move cursor position to the next query in the active query set
   *
   * If the cursor moves past the last query in the active query set, the active query set moves to
   * the next available one and the cursor position to its first query.  If the current query set
   * is the last in the collection and thus it is not possible to move to the next query set, the
   * first query set is made active instead, thus ensuring that the cursor always rolls over.
   */
  next(): void {
    this.cursor.next();
  }

  /* eslint-disable complexity */
  /**
   * Return the current selected text range in the form of a `Range` object
   *
   * If there is no selected text, `null` is returned.
   *
   * @returns {Range|null} The current selected text range or `null` if it could not be
   * computed.
   */
  getSelectedRange(): Range | null {
    const sel = window.getSelection();

    if (!(sel && sel.anchorNode)) {
      return null;
    } else if (sel.anchorNode.nodeType !== 3 || sel.focusNode.nodeType !== 3) {
      console.info('Selection anchor or focus node(s) not text: ignoring');
      return null;
    }

    // Account for selections where the start and end elements are the same *and* whitespace exists
    // longer than one character.  For instance, The element `<p>a b</p>` is shown as `a b` by
    // browsers, where the whitespace is rendered collapsed.  This means that in this particular
    // case, it is not possible to simply retrieve the length of the selection's text and use that
    // as the selection's end offset as it would be invalid.  The way to avoid calculating an
    // invalid end offset is by looking at the anchor and focus (start and end) offsets.
    // Strangely, if the selection spans more than one element, one may simply use the length of
    // the selected text regardless of the occurrence of whitespace in between.
    const len =
      sel.anchorNode === sel.focusNode
        ? Math.abs(sel.focusOffset - sel.anchorOffset)
        : sel.toString().length;
    if (len <= 0) {
      return null;
    }

    // Determine start and end indices in text offset markers array
    const startOffset = this.content.find(sel.anchorNode);
    const endOffset =
      sel.focusNode === sel.anchorNode ? startOffset : this.content.find(sel.focusNode);
    if (startOffset < 0 || endOffset < 0) {
      console.error(
        'Unable to retrieve offset of selection anchor or focus node(s)',
        sel.anchorNode,
        sel.focusNode
      );
      return null;
    }

    // Create start and end range descriptors, whilst accounting for inverse selection where the
    // user selects text in a right to left orientation.
    let startDescr, endDescr;
    if (
      startOffset < endOffset ||
      (startOffset === endOffset && sel.anchorOffset < sel.focusOffset)
    ) {
      startDescr = Range.descriptorRel(this.content.at(startOffset), sel.anchorOffset);

      if (sel.focusNode === sel.anchorNode) {
        endDescr = merge({}, startDescr);
        endDescr.offset += len - 1;
      } else {
        endDescr = Range.descriptorRel(this.content.at(endOffset), sel.focusOffset - 1);
      }
    } else {
      startDescr = Range.descriptorRel(this.content.at(endOffset), sel.focusOffset);

      if (sel.focusNode === sel.anchorNode) {
        endDescr = merge({}, startDescr);
        endDescr.offset += len - 1;
      } else {
        endDescr = Range.descriptorRel(this.content.at(startOffset), sel.anchorOffset - 1);
      }
    }

    return new Range(this.content, startDescr, endDescr);
  }
  /* eslint-enable complexity */

  /**
   * Clear the current text selection
   *
   * Only the Chrome and Firefox implementations are supported.
   */
  clearSelectedRange(): void {
    // From: http://stackoverflow.com/a/3169849/3001914
    // Note that we don't support IE at all.
    if (window.getSelection) {
      if (window.getSelection().empty) {
        // Chrome
        window.getSelection().empty();
      } else if (window.getSelection().removeAllRanges) {
        // Firefox
        window.getSelection().removeAllRanges();
      }
    }
  }

  /**
   * Return boolean indicative of whether one or more query sets are currently contained
   *
   * @returns {boolean} `false` if no query sets currently
   * contained; `true` otherwise. */
  empty(): boolean {
    return this.queries.size === 0;
  }

  /**
   * Return the last id of a query set
   *
   * @param {string} name - the name of the query set.
   * @returns {number} the last id or `-1` if query set empty.
   * */
  lastIdOf(name: string): number {
    const q = this.get_(name);
    const l = q.length;
    return l > 0 ? q.id + l - 1 : -1;
  }

  // Private interface
  // -----------------
  /**
   * Add or append queries to a query set, either enabled or disabled
   *
   * @param {QUerySet} querySet - query set descriptor.
   * @param {Array<any>} queries - array containing the queries to add or append.
   * @param {boolean} enabled - highlights are enabled if `true`;
   * this is the default state.
   *
   * @returns {number} number of highlights added.
   * */
  add_queries_(querySet: any, queries: Array<any>, enabled: boolean): number {
    const content = this.content;
    const markers = this.highlights;
    const reserve = querySet.reserve > 0 ? querySet.reserve - querySet.length : null;

    let count = 0;
    let csscl = null;

    if (this.options.useQueryAsClass) {
      csscl = Css.highlight + '-' + querySet.name;
    }

    let highlighter = new RangeHighlighter(
      querySet.id_highlight,
      querySet.id + querySet.length,
      enabled,
      csscl
    );

    // For each query, perform a lookup in the internal text representation and highlight each hit.
    // The global offset of each highlight is recorded in the `this.highlights´ array.  The offset
    // is used by the `Cursor´ class to compute the next/previous highlight to show.
    queries.forEach((subject: any): void => {
      let hit, finder;

      try {
        finder = constructor.finder(content, subject);
      } catch (x) {
        console.error('exception:', x);
        return;
      }

      if (hit === false) {
        console.info('Query has no hits:', subject);
        return;
      }

      // Note: insertion of global offsets to the `this.highlights` array could (should?) be done
      // in a web worker concurrently.
      while ((hit = finder.next()) !== null) {
        if (reserve !== null && count >= reserve) {
          console.error('highlight reserve exceeded');
          break;
        }

        // $FlowFixMe: dumbo flow! `hit` cannot be `null` as per condition in `while`
        const offset = hit.start.marker.offset + hit.start.offset;
        let mid;
        let min = 0;
        let max = markers.length - 1;

        while (min < max) {
          mid = Math.floor((min + max) / 2);

          if (markers[mid].offset < offset) {
            min = mid + 1;
          } else {
            max = mid;
          }
        }

        markers.splice(markers.length > 0 && markers[min].offset < offset ? min + 1 : min, 0, {
          query: querySet,
          index: count,
          offset: offset,
        });

        try {
          // $FlowFixMe: dumbo flow! `hit` cannot be `null` as per condition in `while` above
          highlighter.do(hit);
          ++count;
        } catch (x) {
          console.error('exception: ', x);
        }
      }
    });

    querySet.length += count;
    if (enabled) {
      this.stats.total += count;
    }

    return count;
  }

  /**
   * Remove a query set by name
   *
   * Throws an exception if the query set does not exist.
   * @access private
   *
   * @param {string} name - The name of the query set to remove.
   */
  remove_(name: string): void {
    const q = this.get_(name);
    const markers = this.highlights;
    let unhighlighter = new RangeUnhighlighter();

    --this.stats.queries;
    this.stats.total -= q.length;

    for (let i = q.id, l = i + q.length; i < l; ++i) {
      unhighlighter.undo(i);
    }

    for (let i = 0; i < markers.length; ) {
      if (markers[i].query === q) {
        markers.splice(i, 1);
      } else {
        ++i;
      }
    }

    this.queries.delete(name);

    // TODO: Unfortunately, using the built-in `normalize` `HTMLElement` method to normalise text
    // nodes means we have to refresh the offsets of the text nodes, which may not be desirable.
    // There must be a better way.
    if (this.options.normalise) {
      this.options.container.normalize();
      this.refresh();
    }

    this.assert_();
  }

  /**
   * Safely retrieve a query set's descriptor
   *
   * Throws an exception if the query set does not exist.
   *
   * @param {string} name - The name of the query set to retrieve.
   * @returns {QuerySet} Query set descriptor
   */
  get_(name: string): QuerySet {
    const q = this.queries.get(name);
    if (q == null) {
      throw new Error(`Query set non-existent: ${name}`);
    }
    return q;
  }

  assert_(): void {
    if (!HtmlHighlighter.debug) {
      return;
    }

    this.content.assert();

    let k;
    let c = 0;
    let l = 0;

    for (const [, query] of this.queries) {
      l += query.length;
    }

    k = 0;
    this.highlights.forEach(function(i) {
      if (i.offset < c || i.index >= i.query.length) {
        throw new Error('Invalid state: highlight out of position');
      }

      c = i.offset;
      ++k;
    });

    if (k !== l) {
      throw new Error('Invalid state: length mismatch');
    }
  }
}

export default HtmlHighlighter;
