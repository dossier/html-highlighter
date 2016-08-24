import Finder from "./finder.js";
import TextNodeXpath from "./textnodexpath.js";
import Range from "./range.js";
import {is_obj} from "./util.js";

/**
 * <p>Class responsible for locating text in a <code>TextContent</code>
 * instance from an XPath representation and start and end offsets.</p>
 * @class
 *
 * @param {TextContent} content - Reference to <code>TextContent</code>
 * instance.
 * @param {string} subject - Descriptor containing an XPath representation
 * and start and end offsets. */
class XpathFinder extends Finder
{
  constructor(content, subject)
  {
    /* Construct base class. */
    super(content);

    if(!is_obj(subject)
       || subject.start.offset < 0
       || subject.end.offset < 0) {
      throw new Error("Invalid or no XPath object specified");
    }

    /* Compute text node start and end elements that the XPath representation
     * refers to. */
    let end;
    let xpath = new TextNodeXpath(this.content.root),
        start = xpath.elementAt(subject.start.xpath);

    /* If an element could not be obtained from the XPath representation, abort
     * now (messages will have been output).*/
    if(start === null) return;
    end = xpath.elementAt(subject.end.xpath);

    if(end === null) return;

    /* Retrieve global character offset of the text node. */
    start = content.find(start); end = content.find(end);
    if(start < 0 || end < 0) {
      console.error("Unable to derive global offsets: %d:%d", start, end);
      return;
    }

    /* Retrieve offset markers. */
    start = content.at(start).offset + subject.start.offset;
    end = content.at(end).offset + subject.end.offset - 1;

    /*     console.log("DEBUG start = ", start, "end = ", end, subject); */

    if(start === end) {
      throw new Error("Invalid XPath representation: start == end");
    } else if(start > end) {
      throw new Error("Invalid XPath representation: start > end");
    }

    /* Save global character offset and relative start and end offsets in
     * descriptor. */
    this.results.push({start: start, end: end});
  }


  /**
   * <p>Return next available match.</p>
   *
   * @returns {Range|false} Returns a <code>Range</code> if a match is
   * available, or <code>false</code> if no more matches are available. */
  next()
  {
    if(this.current >= this.results.length) return false;

    const subject = this.results[this.current];
    ++this.current;

    /* TODO: we don't necessarily need to invoke getAt_ for the end offset.  A
     * check has to be made to ascertain if the end offset falls within the
     * start node. */
    return new Range(
      this.content,
      this.getAt_(subject.start),
      this.getAt_(subject.end)
    );
  }
}

export default XpathFinder;