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
import Renderer from './renderer';
import Cursor from './cursor';
import { createPromiseCapabilities } from './util';

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
    this.renderer.on('unhighlight', this.onHighlightRemoved);

    this.cursor = new Cursor(this.markers);

    // Start by refreshing the internal document's text representation, which initialises
    // `this.content`.
    this.refresh();
    logger.log('instantiated');
  }

  /**
   * Wait until the rendering pipeline is empty
   */
  async wait(): Promise<void> {
    await this.renderer.wait();
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
   * @param {boolean} enabled - If explicitly `false`, query set is disabled; otherwise enabled
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

    const querySet: QuerySet = {
      name,
      enabled,
      queryId: -1,
      highlightId: -1,
      length: 0,
      reserve: null,
    };

    // Enqueue query set removal rendering operation by default to ensure that we succeed in adding
    // this query.  This measure results in no rendering if the query set does not exist.
    this.remove_(name, true);

    const renderer = this.renderer.add(name, queries);
    renderer.on('init', () => {
      // Don't process query set if it turns out to already exist
      if (this.queries.has(name)) {
        renderer.abort();
        return;
      }

      logger.log(`adding queries to: ${querySet.name}`);
      this.queries.set(name, querySet);
      querySet.queryId = this.stats.highlight;
      querySet.highlightId = this.lastId;
      renderer.init(querySet);
    });

    const promise = createPromiseCapabilities();
    renderer.on('done', (count: number): void => {
      querySet.length += count;
      if (enabled) {
        this.stats.total += count;
      }

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

      promise.resolve(count);
    });

    renderer.on('abort', () => promise.resolve());

    this.renderer.next();
    return promise.instance;
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
   *
   * @returns {Promise<number>} Promise that resolves with number of highlights created
   */
  async append(name: string, queries: Array<QuerySubject>): Promise<number> {
    let querySet;
    const renderer = this.renderer.add(name, queries);
    let promise = createPromiseCapabilities();
    renderer.on('init', () => {
      querySet = this.queries.get(name);
      if (querySet == null) {
        renderer.abort();
        return;
      }

      logger.log(`appending queries to: ${querySet.name}`);
      renderer.init(querySet);
    });

    renderer.on('done', (count: number): void => {
      // Should never happen
      if (querySet == null) {
        return;
      }

      querySet.length += count;
      if (querySet.enabled) {
        this.stats.total += count;
      }

      this.cursor.clear();
      this.emit('append', name, querySet, queries);

      if (globals.debugging) {
        this.assert();
      }

      promise.resolve(count);
    });

    renderer.on('abort', () => promise.resolve());

    this.renderer.next();
    return promise.instance;
  }

  /**
   * Remove a query set by name
   *
   * An exception is thrown if the query set does not exist.
   *
   * @param {string} name - Name of the query set to remove.
   */
  async remove(name: string): Promise<void> {
    await this.remove_(name, false);
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
  async clear(reset: boolean): Promise<void> {
    let promises = [];
    for (const [name] of this.queries) {
      promises.push(this.remove_(name, false));
    }

    await Promise.all(promises);

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

  /**
   * @event
   * Handle highlight removal
   *
   * Removes state associated with highlight and exposes event for clients.
   *
   * @param {number} id - highlight ID
   */
  onHighlightRemoved = (id: number): void => {
    this.state.delete(id);
    this.emit('unhighlight', id);
  };

  // Private interface
  // -----------------
  /**
   * Remove a query set by name
   *
   * Throws an exception if the query set does not exist.
   * @access private
   *
   * @param {string} name - The name of the query set to remove.
   * @param {boolean} enqueue - When `true` causes rendering to be enqueued and not started.
   *
   * @returns {Promise<void>} Promise that resolves upon completion
   */
  async remove_(name: string, enqueue: boolean): Promise<void> {
    let querySet;
    const promise = createPromiseCapabilities();
    const renderer = this.renderer.remove();
    renderer.on('init', () => {
      querySet = this.queries.get(name);
      if (querySet == null) {
        renderer.abort();
        return;
      }

      logger.log(`remove query set: ${querySet.name}`);
      renderer.init(querySet);
    });

    renderer.on('done', () => {
      // Should never happen
      if (querySet == null) {
        return;
      }

      this.markers.removeAll(querySet);
      this.queries.delete(name);

      --this.stats.queries;
      this.stats.total -= querySet.length;

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

      promise.resolve();
    });

    renderer.on('abort', () => promise.resolve());

    if (!enqueue) {
      this.renderer.next();
    }
    return promise.instance;
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
