import $ from "jquery";

import Finder from "./finder.js";
import Range from "./range.js";

/* FIXME: create a class for matching of regular expression subjects. */
/**
 * Class responsible for finding text in a `TextContent` instance
 */
class TextFinder extends Finder {
  /**
   * Class constructor
   *
   * @param {TextContent} content - Reference to `TextContent` instance
   * @param {string} subject - Subject string to match
   */
  constructor(content, subject) {
    // Construct base class
    super(content);

    // Build an array containing all hits of `subject´
    let match;
    const re = (
      subject instanceof RegExp
        ? subject
        : new RegExp(subject.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&"), "gi")
    );

    while((match = re.exec(this.content.text)) !== null) {
      this.results.push({ length: match[0].length, index: match.index });
    }
  }

  /**
   * Return next available match.
   *
   * @returns {Range|false} Returns a `Range` if a match is available, or `false` if no more
   * matches are available.
   */
  next() {
    if(this.current >= this.results.length) {
      return false;
    }

    const match = this.results[this.current];
    const length = match.length;
    const start = this.getAt_(match.index);
    let end;

    // Re-use start marker descriptor if end offset within bounds of start text node
    if(start.offset + length <= start.marker.node.nodeValue.length) {
      end = $.extend({ }, start);
      end.offset = start.offset + length - 1;
    } else {
      end = this.getAt_(match.index + length - 1);
    }

    const range = new Range(this.content, start, end);
    ++this.current;

    return range;
  }
}

export default TextFinder;
