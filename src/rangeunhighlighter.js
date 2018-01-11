// @flow

import * as dom from './dom';

/**
 * Convenience class for removing highlighting
 */
class RangeUnhighlighter {
  /**
   * Remove highlighting given by its id
   *
   * @param {number} id - ID of the highlight to remove
   */
  undo(id: number): void {
    const coll = dom.getHighlightElements(id);
    for (const el of coll) {
      for (const child of el.childNodes) {
        (el.parentNode: any).insertBefore(child, el);
      }

      el.remove();
    }
  }
}

export default RangeUnhighlighter;
