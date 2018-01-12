// @flow

import { Css } from './consts';
import Range from './range';

/**
 * Convenience class for applying highlighting on `Range` instances.
 *
 * @param {number} count - The CSS highlight class index to use
 * @param {number} id - The individual id to apply to the highlight
 * @param {bool} enabled - If explicitly `false`, highlights are created but not shown
 * @param {string | null} cssClass - Additional CSS class to use
 */
class RangeHighlighter {
  id: number;
  classes: string;

  constructor(count: number, id: number, enabled: boolean, cssClass: string | null) {
    const classes = [Css.highlight, `${Css.highlight}-${count}`];

    if (cssClass != null) {
      classes.push(cssClass);
    }

    if (enabled === false) {
      classes.push(Css.disabled);
    }

    this.classes = classes.join(' ');
    this.id = id;
  }

  /**
   * Highlight a `Range` instance
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
