import {Css} from "./consts.js";

/**
 * <p>Convenience class for removing highlighting.</p>
 * @class
 * */
var RangeUnhighlighter = function()
{
  /**
   * <p>Remove highlighting given by its id.</p>
   *
   * @param {number} id - Id of the highlight to remove. */
  this.undo = function(id) {
    $("." + Css.highlight + "-id-" + id).each(function() {
      const $el = $(this);

      $el.contents().insertBefore($el);
      $el.remove();
    });
  };
};

export default RangeUnhighlighter;