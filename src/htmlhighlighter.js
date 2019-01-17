// @flow
/* eslint-disable camelcase */
import EventEmitter from 'events';

import merge from 'merge';

import globals from './globals';
import logger from './logger';
import type { ClientOptions, Options, Stats, QuerySet, QuerySubject } from './typedefs';
import { Css } from './consts';
import * as dom from './dom';
import TextContent from './textcontent';
import HighlightMarkers from './highlightmarkers';
import RangeUnhighlighter from './rangeunhighlighter';
import Renderer from './renderer';
import Cursor from './cursor';

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
 */
class HtmlHighlighter extends EventEmitter {
  options: Options;
  renderer: Renderer;
  cursor: Cursor;
  stats: Stats;
  lastId: number;
  content: TextContent;
  queries: Map<string, QuerySet>;
  markers: HighlightMarkers;
  state: Map<number, any>;

  // Default options.  Note that we cannot declare this map as `Options` since not all attributes
  // are defined (e.g. `container`).
  static defaults: ClientOptions = {
    // Sometimes it is useful for the client to determine how to bring an element into view via
    // scrolling. If `scrollTo` is set, then it is called as a function with a `Node` to scroll
    // to.
    scrollTo: null,
    maxHighlight: 1,
    useQueryAsClass: false,
    normalise: true,
    rendering: {
      async: false,
      interval: 250, // In effect only if `async` is `true`; value in ms.
    },
  };

  constructor(options: ClientOptions) {
    super();

    // Merge default options
    this.options = merge({}, HtmlHighlighter.defaults, options);

    this.queries = new Map();
    this.markers = new HighlightMarkers();
    this.state = new Map();

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

    this.renderer = new Renderer(this.options);
    this.renderer.on('highlight', this.onHighlightCreated);

    this.cursor = new Cursor(this.markers);

    // Start by refreshing the internal document's text representation, which initialises
    // `this.content`.
    this.refresh();
    logger.log('instantiated');
  }

  /**
   * Refreshes the internal representation of the text.
   *
   * Should only be invoked when the HTML structure mutates.
   */
  refresh(): void {
    this.content = new TextContent(this.options.container);
    if (globals.debugging) {
      this.assert();
    }
    this.renderer.setContent(this.content);
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
   * @returns {Promise<number>} Promise that resolves with number of highlights created
   */
  async add(
    name: string,
    queries: Array<any>,
    enabled: boolean = true,
    reserve: number | null = null
  ): Promise<number> {
    enabled = enabled === true;
    if (typeof reserve !== 'number' || reserve < 1) {
      reserve = null;
    }

    // Remove query set if it exists
    if (this.queries.has(name)) {
      this.remove(name);
    }

    const querySet: QuerySet = {
      name,
      enabled,
      queryId: this.stats.highlight,
      highlightId: this.lastId,
      length: 0,
      reserve: null,
    };

    this.queries.set(name, querySet);

    const count = await this.add_queries_(querySet, queries, enabled === true);
    if (reserve != null) {
      if (reserve > count) {
        this.lastId = reserve;
        querySet.reserve = reserve;
      } else {
        logger.error('invalid or insufficient reserve specified');
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
    this.emit('add', name, querySet, queries);

    if (globals.debugging) {
      this.assert();
    }

    return count;
  }

  /**
   * Append one or more queries to an existing query set
   *
   * If the query set doesn't yet exist, an exception is thrown. In addition, the query set
   * **must** have enough reserved space available to contain the new queries.  All queries not
   * fitting in the container are suppressed.
   *
   * @param {string} name - Name of the query set
   * @param {QuerySubject} queries - Array containing individual queries to highlight
   * @param {bool} enabled - If `true`, query set is also enabled
   *
   * @returns {Promise<number>} Promise that resolves with number of highlights created
   */
  async append(
    name: string,
    queries: Array<QuerySubject>,
    enabled: boolean = true
  ): Promise<number> {
    const querySet = this.queries.get(name);
    if (querySet == null) {
      throw new Error('Invalid or query set not yet created');
    }

    const count = await this.add_queries_(querySet, queries, enabled === true);
    this.cursor.clear();
    this.emit('append', name, querySet, queries);

    if (globals.debugging) {
      this.assert();
    }

    return count;
  }

  /**
   * Remove a query set by name
   *
   * An exception is thrown if the query set does not exist.
   *
   * @param {string} name - Name of the query set to remove.
   */
  remove(name: string): void {
    this.remove_(name);
    this.cursor.clear();
    this.emit('remove', name);
  }

  /**
   * Enable a query set
   *
   * An exception is thrown if the query set does not exist.  If the query set is currently already
   * enabled, nothing is done.
   *
   * @param {string} name - Name of the query set to enable.
   */
  enable(name: string): void {
    const q = this.get_(name);
    if (q.enabled) {
      return;
    }

    dom.removeClass(dom.getForQuerySet(q.queryId), Css.disabled);

    q.enabled = true;
    this.stats.total += q.length;
    this.cursor.clear();
    this.emit('enable', name);
  }

  /**
   * Disable a query set
   *
   * An exception is thrown if the query set does not exist.  If the query set is currently already
   * disabled, nothing is done.
   *
   * @param {string} name - Name of the query set to disable.
   */
  disable(name: string): void {
    const q = this.get_(name);
    if (!q.enabled) {
      return;
    }

    dom.addClass(dom.getForQuerySet(q.queryId), Css.disabled);

    q.enabled = false;
    this.stats.total -= q.length;
    this.cursor.clear();
    this.emit('disable', name);
  }

  /**
   * Remove all query sets
   *
   * Optionally, the last query set id can be reset.
   *
   * @param {boolean} reset - Last query set id is reset, if `true`.
   */
  clear(reset: boolean): void {
    for (const [name] of this.queries) {
      this.remove_(name);
    }

    if (reset) {
      this.lastId = 0;
      this.stats.highlight = 0;
    }

    this.cursor.clear();
    this.emit('clear');

    if (globals.debugging) {
      this.assert();
    }
  }

  /**
   * Return boolean value indicating whether a query exists
   *
   * @param {string} name - the name of query set
   * @returns {boolean} `true` if query exists
   */
  has(name: string): boolean {
    return this.queries.has(name);
  }

  /**
   * Return state associated with highlight
   *
   * @param {number} highlightId - Highlight ID
   * @returns {any} State associated with highlight; `undefined` or `null` otherwise
   */
  getState(highlightId: number): any {
    return this.state.get(highlightId);
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
   * Return the last highlight id of a query set
   *
   * @param {string} name - the name of the query set.
   * @returns {number} the last highlight id or `-1` if query set empty.
   * */
  lastIdOf(name: string): number {
    const q = this.get_(name);
    const l = q.length;
    return l > 0 ? q.highlightId + l - 1 : -1;
  }

  /**
   * @event
   * Handle highlight creation
   *
   * Contains state associated with highlight and exposes event for clients.
   *
   * @param {QuerySet} querySet - associated highlight query set
   * @param {TextRange} hit - highlight text range
   * @param {number} id - highlight ID
   * @param {any} state - associated highlight state
   */
  onHighlightCreated = (querySet: QuerySet, hit: TextRange, id: number, state: any): void => {
    // $FlowFixMe: `hit` cannot be `null` here as per condition in `while` above
    this.markers.add(querySet, id, hit);
    if (state != null) {
      this.state.set(id, state);
    }
    this.emit('highlight', id, state);
  };

  // Private interface
  // -----------------
  /**
   * Add or append queries to a query set, either enabled or disabled
   *
   * @param {QuerySet} querySet - query set descriptor.
   * @param {Array<QuerySubject>} queries - array containing the queries to add or append.
   * @param {boolean} enabled - highlights are enabled if `true`
   *
   * @returns {number} number of highlights added.
   * */
  async add_queries_(
    querySet: QuerySet,
    queries: Array<QuerySubject>,
    enabled: boolean
  ): Promise<number> {
    logger.log(`adding queries for: ${querySet.name}`);
    const count = await this.renderer.add(querySet, queries, enabled);
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
    let unhighlighter = new RangeUnhighlighter();

    --this.stats.queries;
    this.stats.total -= q.length;

    for (let id = q.highlightId, l = id + q.length; id < l; ++id) {
      unhighlighter.undo(id);
      this.state.delete(id);

      // Notify observers of creation of new highlight
      this.emit('unhighlight', id);
    }

    this.markers.removeAll(q);
    this.queries.delete(name);

    // TODO: Unfortunately, using the built-in `normalize` `HTMLElement` method to normalise text
    // nodes means we have to refresh the offsets of the text nodes, which may not be desirable.
    // There must be a better way.
    if (this.options.normalise) {
      this.options.container.normalize();
      this.refresh();
    }

    if (globals.debugging) {
      this.assert();
    }
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

  /**
   * Perform assorted debugging assertions
   */
  assert(): void {
    this.content.assert();

    let size = 0;
    for (const [, query] of this.queries) {
      size += query.length;
    }

    this.markers.assert(size);

    if (this.lastId === 0 || this.stats.highlight === 0) {
      if (this.lastId !== this.stats.highlight) {
        throw new Error('IDs mismatch when empty');
      } else if (this.queries.size !== 0) {
        throw new Error('Queries map not empty');
      } else if (this.state.size !== 0) {
        throw new Error('Highlight state map not empty');
      }
    } else if (this.state.size > size) {
      throw new Error('Unexpected highlight state');
    }
  }
}

export default HtmlHighlighter;
