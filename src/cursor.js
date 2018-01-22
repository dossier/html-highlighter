// @flow

import EventEmitter from 'events';

import * as dom from './dom';
import { Css } from './consts';
import HtmlHighlighter from './htmlhighlighter';

/**
 * Class responsible for managing the state of the highlight cursor
 *
 * Emits the following events:
 *
 *  - clear: cursor position is cleared
 *  - setiterable: allowable iterable queries set or cleared
 *  - update: cursor position mutated
 */
class Cursor extends EventEmitter {
  owner: HtmlHighlighter;
  index: number;
  iterableQueries: Array<string> | null;
  total: number;

  /**
   * Class constructor
   *
   * @param {Object} owner - Reference to the owning instance
   */
  constructor(owner: HtmlHighlighter) {
    super();

    this.owner = owner;
    this.index = -1;
    this.iterableQueries = null;
    this.total = 0;
    this.setIterableQueries(null);
  }

  /**
   * Clear the current cursor state and recalculate number of total iterable highlights */
  clear(): void {
    this.clearActive_();
    this.index = -1;
    this.update(true);
    this.emit('clear');
  }

  /**
   * Set or clear the query sets that the cursor can move through
   *
   * When one or more query sets are specified, cursor movement is restricted to the specified
   * query sets.  When setting the cursor offset, the offset will then apply within the context of
   * the active iterable query sets.
   *
   * The restriction can be lifted at any time by passing `null` to the method.
   *
   * @param {(Array|string)} queries - An array (or string) containing the query set names.
   */
  setIterableQueries(queries: Array<string> | null): void {
    if (queries == null) {
      this.iterableQueries = null;
    } else {
      this.iterableQueries = queries.slice();
    }

    this.clear();
    this.emit('setiterable', queries);
  }

  /**
   * Update the total of iterable highlights
   *
   * Causes recomputation of the total available number of highlights to be recomputed and the
   * update event to be produced if this number changes.  The event can be forcefully produced
   * it `force` is set to `true`.
   *
   * @param { boolean } force - When `true` causes the "update" event to always be emitted
   */
  update(force: boolean = false): void {
    const iterable = this.iterableQueries;
    let total = 0;
    if (iterable == null) {
      total = this.owner.stats.total;
    } else if (iterable.length > 0) {
      const markers = this.owner.highlights;
      for (let i = markers.length - 1; i >= 0; --i) {
        if (iterable.indexOf(markers[i].query.name) >= 0) {
          ++total;
        }
      }
    }

    if (force || total !== this.total) {
      this.total = total;
      this.emit('update', this.index, this.total);
    }
  }

  /**
   * Set cursor to query referenced by absolute query index
   *
   * @param {number} index - Virtual cursor index
   * @param {boolean} dontRecurse - When `true` instructs the method not to employ recursion
   *
   * @returns {boolean} `true` if move occurred
   */
  set(index: number, dontRecurse: boolean): boolean {
    const owner = this.owner;
    const markers = owner.highlights;

    if (index < 0) {
      throw new Error('Invalid cursor index specified: ' + index);
    } else if (owner.stats.total <= 0) {
      return false;
    }

    let count = index;
    let ndx = null;
    const iterable = this.iterableQueries;

    markers.some(function(m, i) {
      const q = m.query;

      if (!q.enabled) {
        return false;
      } else if (iterable !== null && iterable.indexOf(q.name) < 0) {
        return false;
      } else if (count === 0) {
        ndx = i;
        return true;
      }

      --count;
      return false;
    });

    // If index overflown, set to first highlight
    if (ndx === null) {
      if (!dontRecurse) {
        this.set(0, true);
      }
      return false;
    }

    // Clear currently active highlight, if any, and set requested highlight active
    this.clearActive_();
    const c = markers[ndx];
    const coll = dom.getHighlightElements(c.query.id + c.index);

    // Scroll viewport if element not visible
    if (coll.length > 0) {
      dom.addClass(coll, Css.enabled);

      const first = coll[0];
      if (typeof owner.options.scrollTo === 'function') {
        owner.options.scrollTo(first);
      } else if (!dom.isInView(first)) {
        dom.scrollIntoView(first);
      }
    }

    if (this.index === index) {
      return false;
    }

    this.index = index;
    this.emit('update', index, this.total);
    return true;
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
    if (this.total > 0) {
      this.set((this.index < 1 ? this.total : this.index) - 1, false);
    }
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
    this.set(this.index + 1, false);
  }

  // Private interface
  // -----------------
  /**
   * Clear the currently active cursor highlight
   *
   * The active cursor highlight is the element or elements at the current cursor position.
   * @access private
   */
  clearActive_(): void {
    const { enabled: cssEnabled } = Css;
    for (const el of dom.getAllHighlightElements(cssEnabled)) {
      dom.removeClass(el, cssEnabled);
    }
  }
}

export default Cursor;
