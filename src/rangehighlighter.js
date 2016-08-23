import {Css} from "./consts.js";

/**
 * <p>Convenience class for applying highlighting on <code>Range</code>
 * instances.</p>
 * @class
 * @param {number} count - The CSS highlight class index to use.
 * @param {number} id - The individual id to apply to the highlight.
 * @param {bool} enabled - If explicitly <code>false</code>, highlights are
 * created but not shown. */
var RangeHighlighter = function(count, id, enabled, cssClass)
{
  let classes = [
    Css.highlight,
    Css.highlight + "-" + count
  ];

  if(cssClass)          classes.push(cssClass);
  if(enabled === false) classes.push(Css.disabled);
  classes = classes.join(" ");

  /**
   * <p>Highlight a <code>Range</code> instance.</p>
   *
   * @param {Range} range - Range instance to apply highlighting to.
   * @returns {number} Unique highlight id. */
  this.do = function(range) {
    range.surround(classes + " " + Css.highlight + "-id-" + id);
    return id++;
  };
};

export default RangeHighlighter;