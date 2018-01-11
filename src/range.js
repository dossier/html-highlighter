/* eslint-disable camelcase */
import * as dom from './dom';
import TextNodeVisitor from './textnodevisitor';
import TextNodeXpath from './textnodexpath';

/**
 * Holds a representation of a range between two text nodes
 *
 * @param {TextContent} content - text representation instance
 * @param {Object} start - descriptor of start of range
 * @param {Object} end - descriptor of end of range
 */
class Range {
  /**
   * Create a range descriptor from a global offset.
   *
   * @param {Object} marker - Text offset marker object
   * @param {number} offset - Global offset
   *
   * @returns {Object} Range descriptor */
  static descriptorAbs(marker, offset) {
    return {
      marker: marker,
      offset: offset - marker.offset,
    };
  }

  /**
   * Create a range descriptor from an offset relative to the start of the text node
   *
   * @param {Object} marker - Text offset marker object
   * @param {number} offset - Relative offset from start of text node
   *
   * @returns {Object} Range descriptor
   */
  static descriptorRel(marker, offset) {
    return {
      marker: marker,
      offset,
    };
  }

  constructor(content, start, end) {
    this.content = content;

    // Sanity check:
    if (start.marker.offset + start.offset > end.marker.offset + end.offset) {
      throw new Error('Invalid range: start > end');
    }

    // Attributes
    Object.defineProperties(this, {
      start: { value: start },
      end: { value: end },
    });
  }

  /**
   * Highlight a range
   *
   * Highlights a given range by wrapping one or more text nodes with a `span` tag and applying a
   * particular CSS class.
   *
   * @param {string} className - The CSS class name to apply
   */
  surround(className) {
    // Optimised case: highlighting does not span multiple nodes
    if (this.start.marker.node === this.end.marker.node) {
      this.surround_(this.start, this.start.offset, this.end.offset, className);
      return;
    }

    // Highlighting spans 2 or more nodes, which means we need to build a representation of all the
    // text nodes contained in the start to end range, but excluding the start and end nodes
    const visitor = new TextNodeVisitor(this.start.marker.node, this.content.root);
    const end = this.end.marker.node;
    let coll = [];

    // TODO: we assume `visitor.next()' will never return null because `end´ is within bounds
    while (visitor.next() !== end) {
      coll.push(visitor.current);
    }

    // Apply highlighting to start and end nodes, and to any nodes in between, if applicable.
    // Highlighting for the start and end nodes may require text node truncation but not for the
    // nodes in between.
    this.surround_(this.start, this.start.offset, null, className);
    coll.forEach(n => this.surround_whole_(n, className));
    this.surround_(this.end, 0, this.end.offset, className);
  }

  /**
   * Compute the XPath representation of the active range
   *
   * @returns {string} XPath representation of active range
   */
  computeXpath() {
    const start = this.start.marker.node;
    const end = this.end.marker.node;
    let computor = new TextNodeXpath(this.content.root);
    return {
      start: {
        xpath: computor.xpathOf(start),
        offset: this.start.offset + computor.offset(start),
      },
      end: {
        xpath: computor.xpathOf(end),
        offset: this.end.offset + computor.offset(end) + 1,
      },
    };
  }

  /**
   * Compute the length of the active range
   *
   * @returns {number} Number of characters
   */
  length() {
    // Optimised case: range does not span multiple nodes
    if (this.start.marker.node === this.end.marker.node) {
      return this.end.offset - this.start.offset + 1;
    }

    // Range spans 2 or more nodes
    let visitor = new TextNodeVisitor(this.start.marker.node, this.content.root);
    const end = this.end.marker.node;
    let length = this.start.marker.node.nodeValue.length - this.start.offset + this.end.offset + 1;

    // Add (whole) lengths of text nodes in between
    while (visitor.next() !== end) {
      length += visitor.current.nodeValue.length;
    }

    return length;
  }

  // Private interface
  // -----------------
  /**
   * Truncate text node and apply highlighting
   *
   * Truncates text node into 2 or 3 text nodes and apply highlighting to relevant node, which is
   * always the node referenced by `descr.marker.node`.
   *
   * @param {Object} descr - Start or end `Range` descriptor
   * @param {number} start - Start offset
   * @param {number} end - End offset
   * @param {string} className - CSS class name to apply
   */
  surround_(descr, start, end, className) {
    this.content.truncate(
      descr.marker,
      start,
      end === null ? descr.marker.node.nodeValue.length - 1 : end
    );

    dom.createHighlightElement(descr.marker.node, className);
  }

  /**
   * Apply highlighting fully to a text node
   *
   * No text node truncation occurs.
   *
   * @param {DOMElement} node - Text node to apply highlighting to
   * @param {string} className - CSS class name to apply
   * */
  surround_whole_(node, className) {
    dom.createHighlightElement(node, className);
  }
}

export default Range;
