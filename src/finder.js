// @flow

import TextContent from './textcontent';
/* eslint-disable camelcase */
import * as util from './util';
/* eslint-enable camelcase */
import TextRange from './textrange';
import type { RangeDescriptor } from './textrange';

/**
 * Abstract base class of all finder classes
 *
 * @abstract
 * @param {TextContent} content - reference to `TextContent` holding a text representation of the
 * document.
 * @param {*} subject - subject to find; can be of any type
 */
class Finder {
  content: TextContent;
  results: Array<any>;
  current: number;

  constructor(content: TextContent) {
    this.content = content;
    this.results = [];
    this.current = 0;
  }

  /**
   * @abstract
   * Return next available match
   *
   * If no more matches available, returns `null`.
   *
   * @returns {TextRange | null} Returns a `TextRange` if a match is available, or `null` if no
   * more matches are available.
   */
  // $FlowFixMe: below signature is needed in specialized classes
  next(): TextRange | null {
    util.abstract();
  }

  // Protected interface
  // -------------------
  /**
   * Return a `TextRange` descriptor for a given offset
   * @access private
   *
   * @param {number} offset - Text offset
   * @returns {RangeDescriptor} Range descriptor
   */
  getAt_(offset: number): RangeDescriptor {
    const index = this.content.indexOf(offset);
    if (index === -1) {
      throw new Error('Failed to retrieve marker for offset: ' + offset);
    }

    return TextRange.descriptorAbs(this.content.at(index), offset);
  }
}

export default Finder;
