import {absm_noti} from "./util.js";
import Range from "./range.js";

/**
 * <p>Abstract base class of all finder classes.</p>
 * @class
 * @abstract
 * @param {TextContent} content - reference to <code>TextContent</code>
 * holding a text representation of the document.
 * @param {*} subject - subject to find; can be of any type.
 * */
class Finder
{
  constructor(content)
  {
      Object.defineProperty(this, "content", {value: content});

      this.results = [];
      this.current = 0;
    }

  /**
   * <p>Return next available match.  If no more matches available, returns
   * <code>false</code>.</p>
   * @abstract
   *
   * @returns {Range|false} Returns a <code>Range</code> if a match is
   * available, or <code>false</code> if no more matches are available. */
  next()
  { absm_noti(); }

  /* Protected interface
   * ----------------- */
  /**
   * <p>Return a <code>Range</code> descriptor for a given offset.</p>
   * @access private
   *
   * @param {number} offset - Text offset
   * @returns {Object} Range descriptor. */
  getAt_(offset)
  {
    const index = this.content.indexOf(offset);
    if(index === -1) {
      throw new Error("Failed to retrieve marker for offset: " + offset);
    }

    return Range.descriptorAbs(this.content.at(index), offset);
  }
}

export default Finder;
