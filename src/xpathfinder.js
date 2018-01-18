// @flow

import TextContent from './textcontent';
import Finder from './finder';
import TextNodeXpath from './textnodexpath';
import Range from './range';
import logger from './logger';

export type XpathSubject = {|
  start: { xpath: string, offset: number },
  end: { xpath: string, offset: number },
|};

/**
 * Class responsible for locating text in a `TextContent` instance from an
 * XPath representation and start and end offsets.
 */
class XpathFinder extends Finder {
  /**
   * Class constructor
   *
   * @param {TextContent} content - Reference to `TextContent` instance
   * @param {XpathSubject} subject - Descriptor containing an XPath representation and
   * start and end offsets.
   */
  // FIXME: what type is `subject`?
  constructor(content: TextContent, subject: XpathSubject) {
    // Construct base class
    super(content);

    if (subject.start.offset < 0 || subject.end.offset < 0) {
      throw new Error('Invalid or no XPath object specified');
    }

    // Compute text node start and end elements that the XPath representation refers to.
    let end;
    let xpath = new TextNodeXpath(this.content.root);
    let start = xpath.elementAt(subject.start.xpath);

    // If an element could not be obtained from the XPath representation, abort now (messages will
    // have been output).
    if (start === null) {
      return;
    }

    end = xpath.elementAt(subject.end.xpath);
    if (end === null) {
      return;
    }

    // Retrieve global character offset of the text node.
    start = content.find(start);
    end = content.find(end);
    if (start < 0 || end < 0) {
      logger.error(
        'unable to derive global offsets: %d:%d [xpath=%s:%s to end=%s:%s]',
        start,
        end,
        subject.start.xpath,
        subject.start.offset,
        subject.end.xpath,
        subject.end.offset
      );
      return;
    }

    // Retrieve offset markers.
    start = content.at(start).offset + subject.start.offset;
    end = content.at(end).offset + subject.end.offset - 1;

    /* logger.log("DEBUG start = ", start, "end = ", end, subject); */

    if (start > end) {
      throw new Error('Invalid XPath representation: start > end');
    }

    // Save global character offset and relative start and end offsets in descriptor.
    this.results.push({ start, end });
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

    const subject: any = this.results[this.current];
    if (subject == null) {
      throw new Error('Subject not found');
    }
    ++this.current;

    // TODO: we don't necessarily need to invoke getAt_ for the end offset.  A check has to be made
    // to ascertain if the end offset falls within the start node.
    return new Range(this.content, this.getAt_(subject.start), this.getAt_(subject.end));
  }
}

export default XpathFinder;
