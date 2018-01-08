import $ from 'jquery';

import { Css } from './consts.js';

/**
 * Convenience class for removing highlighting
 * @class
 */
function RangeUnhighlighter() {
  /**
   * Remove highlighting given by its id
   *
   * @param {number} id - ID of the highlight to remove
   */
  this.undo = function(id) {
    $('.' + Css.highlight + '-id-' + id).each(function() {
      // eslint-disable-next-line
      const $el = $(this);

      $el.contents().insertBefore($el);
      $el.remove();
    });
  };
}

export default RangeUnhighlighter;
