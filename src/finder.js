/* eslint-disable camelcase */
import { absm_noti } from './util.js';
import Range from './range.js';
/* eslint-enable camelcase */

/**
 * Abstract base class of all finder classes
 *
 * @abstract
 * @param {TextContent} content - reference to `TextContent` holding a text representation of the
 * document.
 * @param {*} subject - subject to find; can be of any type
 */
class Finder {
  constructor(content) {
    Object.defineProperty(this, 'content', { value: content });

    this.results = [];
    this.current = 0;
  }

  /**
   * @abstract
   * Return next available match
   *
   * If no more matches available, returns `false`.
   *
   * @returns {Range|false} Returns a `Range` if a match is available, or `false` if no more
   * matches are available.
   */
  next() {
    absm_noti();
  }

  // Protected interface
  // -------------------
  /**
   * Return a `Range` descriptor for a given offset
   * @access private
   *
   * @param {number} offset - Text offset
   * @returns {Object} Range descriptor
   */
  getAt_(offset) {
    const index = this.content.indexOf(offset);
    if (index === -1) {
      throw new Error('Failed to retrieve marker for offset: ' + offset);
    }

    return Range.descriptorAbs(this.content.at(index), offset);
  }
}

export default Finder;
