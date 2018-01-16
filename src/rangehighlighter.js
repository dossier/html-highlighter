import {Css} from "./consts.js";

/**
 * Convenience class for applying highlighting on `Range` instances.
 * @class
 *
 * @param {number} count - The CSS highlight class index to use
 * @param {number} id - The individual id to apply to the highlight
 * @param {bool} enabled - If explicitly `false`, highlights are created but not shown
 * @param {string} cssClass - Additional CSS class to use
 */
function RangeHighlighter(count, id, enabled, cssClass) {
  let classes = [
    Css.highlight,
    Css.highlight + "-" + count,
  ];

  if(cssClass) {
    classes.push(cssClass);
  }

  if(enabled === false) {
    classes.push(Css.disabled);
  }

  classes = classes.join(" ");

  /**
   * Highlight a `Range` instance
   *
   * @param {Range} range - Range instance to apply highlighting to
   * @returns {number} Unique highlight id
   */
  this.do = function(range) {
    range.surround(classes + " " + Css.highlight + "-id-" + id);
    return id++;
  };
}

export default RangeHighlighter;
