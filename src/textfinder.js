// @flow

import merge from 'merge';

import type { TextSubject } from './typedefs';
import TextContent from './textcontent';
import Finder from './finder';
import Range from './range';

/* FIXME: create a class for matching of regular expression subjects. */
/**
 * Class responsible for finding text in a `TextContent` instance
 */
class TextFinder extends Finder {
  /**
   * Determine if given subject is of type accepted by the `TextFinder` class
   *
   * This method determines if a given subject can be used to instantiate a `TextFinder` class.
   *
   * @param {any} subject - Subject to determine
   * @returns {boolean} `true` if subject can be used to instantiate a `TextFinder` class
   */
  static isSubject(subject: any): boolean {
    return typeof subject === 'string' || subject instanceof RegExp;
  }

  /**
   * Class constructor
   *
   * @param {TextContent} content - Reference to `TextContent` instance
   * @param {TextFinderSubject} subject - Subject string to match
   */
  constructor(content: TextContent, subject: TextSubject) {
    // Construct base class
    super(content);

    // Build an array containing all hits of `subject´
    let match;
    const re =
      subject instanceof RegExp
        ? subject
        : new RegExp(subject.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&'), 'gi');

    while ((match = re.exec(this.content.text)) !== null) {
      this.results.push({ length: match[0].length, index: match.index });
    }
  }

  /**
   * Return next available match
   *
   * @returns {Range | null} Returns a `Range` if a match is available, or `null` if no more
   * matches are available.
   */
  next(): Range | null {
    if (this.current >= this.results.length) {
      return null;
    }

    const match = this.results[this.current];
    const length = match.length;
    const start = this.getAt_(match.index);
    let end;

    // Re-use start marker descriptor if end offset within bounds of start text node
    if (start.offset + length <= start.marker.node.nodeValue.length) {
      end = merge({}, start);
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
