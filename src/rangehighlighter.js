// @flow

import { Css } from './consts';
import Range from './range';

/**
 * Convenience class for applying highlights on arbitrary `Range` instances
 *
 * A `classes` attribute is cached at construction time with the CSS classes that will apply to all
 * created highlight instances, namely the:
 *
 *   - base highlight class (e.g. `hh-highlight`)
 *   - query ID class (e.g. `hh-highlight-1`)
 *
 * Then, each time a given range is highlighted, the CSS classes applied to the created highlight
 * element(s) are whatever was crafted at construction time plus a CSS class that uniquely
 * identifies the highlight, which takes the following form: `hh-highlight-id-${highlightID}`.
 * Finally, the highlight ID is returned but also incremented so the next generated highlight is
 * guaranteed to be unique.
 */
class RangeHighlighter {
  id: number;
  classes: string;

  /**
   * Class constructor
   *
   * @param {number} queryId - The ID of the query set highlights belong to
   * @param {number} highlightId - The first available highlight ID to apply
   * @param {bool} enabled - If explicitly `false`, highlights are created but not shown
   * @param {string | null} cssClass - Additional CSS class to use
   */
  constructor(queryId: number, highlightId: number, enabled: boolean, cssClass: string | null) {
    const classes = [Css.highlight, `${Css.highlight}-${queryId}`];

    if (cssClass != null) {
      classes.push(cssClass);
    }

    if (enabled === false) {
      classes.push(Css.disabled);
    }

    this.classes = classes.join(' ');
    this.id = highlightId;
  }

  /**
   * Highlight a `Range` instance
   *
   * Causes the current highlight `id` attribute to be incremented.
   *
   * @param {Range} range - Range instance to apply highlighting to
   * @returns {number} Unique highlight id
   */
  do(range: Range): number {
    range.surround(`${this.classes} ${Css.highlight}-id-${this.id}`);
    return this.id++;
  }
}

export default RangeHighlighter;
