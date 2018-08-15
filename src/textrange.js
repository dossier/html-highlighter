// @flow

import * as dom from './dom';
import TextContent from './textcontent';
import TextNodeVisitor from './textnodevisitor';
import TextNodeXpath from './textnodexpath';
import type { Marker } from './textcontent';

export type RangeDescriptor = {| marker: Marker, offset: number |};

export type RangeXpathDescriptor = {|
  start: { xpath: string, offset: number },
  end: { xpath: string, offset: number },
|};

/**
 * Holds a representation of a range between two text nodes
 *
 * @param {TextContent} content - text representation instance
 * @param {Object} start - descriptor of start of range
 * @param {Object} end - descriptor of end of range
 */
class TextRange {
  content: TextContent;
  start: RangeDescriptor;
  end: RangeDescriptor;

  /**
   * Create a range descriptor from a global offset.
   *
   * @param {Marker} marker - Text offset marker object
   * @param {number} offset - Global offset
   *
   * @returns {RangeDescriptor} Range descriptor */
  static descriptorAbs(marker: Marker, offset: number): RangeDescriptor {
    return { marker, offset: offset - marker.offset };
  }

  /**
   * Create a range descriptor from an offset relative to the start of the text node
   *
   * @param {Marker} marker - Text offset marker object
   * @param {number} offset - Relative offset from start of text node
   *
   * @returns {RangeDescriptor} Range descriptor
   */
  static descriptorRel(marker: Marker, offset: number): RangeDescriptor {
    return { marker, offset };
  }

  constructor(content: TextContent, start: RangeDescriptor, end: RangeDescriptor) {
    this.content = content;

    // Sanity check:
    if (start.marker.offset + start.offset > end.marker.offset + end.offset) {
      throw new Error('Invalid range: start > end');
    }

    this.start = start;
    this.end = end;
  }

  /**
   * Highlight a range
   *
   * Highlights a given range by wrapping one or more text nodes with a `span` tag and applying a
   * particular CSS class.
   *
   * @param {string} className - The CSS class name to apply
   */
  surround(className: string): void {
    // Optimised case: highlighting does not span multiple nodes
    if (this.start.marker.node === this.end.marker.node) {
      this.surround_(this.start, this.start.offset, this.end.offset, className);
      this.start.offset = 0;
      return;
    }

    // Highlighting spans 2 or more nodes, which means we need to build a representation of all the
    // text nodes contained in the start to end range, but excluding the start and end nodes
    const visitor = new TextNodeVisitor(this.start.marker.node, this.content.root);
    const end = this.end.marker.node;
    const coll = [];

    // TODO: we assume `visitor.next()' will never return null because `end´ is within bounds
    while (visitor.next() !== end) {
      coll.push((visitor.current: any));
    }

    // Apply highlighting to start and end nodes, and to any nodes in between, if applicable.
    // Highlighting for the start and end nodes may require text node truncation but not for the
    // nodes in between.
    this.surround_(this.start, this.start.offset, null, className);
    coll.forEach(n => this.surroundWhole_(n, className));
    this.surround_(this.end, 0, this.end.offset, className);
    this.start.offset = 0;
  }

  /**
   * Compute the XPath representation of the active range
   *
   * @returns {RangeXpathDescriptor} XPath representation of active range
   */
  computeXpath(): RangeXpathDescriptor {
    const start = this.start.marker.node;
    const end = this.end.marker.node;
    const computor = new TextNodeXpath(this.content.root);
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
  length(): number {
    // Optimised case: range does not span multiple nodes
    if (this.start.marker.node === this.end.marker.node) {
      return this.end.offset - this.start.offset + 1;
    }

    // Range spans 2 or more nodes
    const visitor = new TextNodeVisitor(this.start.marker.node, this.content.root);
    const end = this.end.marker.node;
    let length = this.start.marker.node.nodeValue.length - this.start.offset + this.end.offset + 1;

    // Add (whole) lengths of text nodes in between
    while (visitor.next() !== end) {
      length += (visitor.current: any).nodeValue.length;
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
   * @param {number | null} end - End offset
   * @param {string} className - CSS class name to apply
   */
  surround_(descr: RangeDescriptor, start: number, end: number | null, className: string): void {
    this.content.truncate(
      descr.marker,
      start,
      end == null ? descr.marker.node.nodeValue.length - 1 : end
    );

    dom.createHighlightElement(descr.marker.node, className);
  }

  /**
   * Apply highlighting fully to a text node
   *
   * No text node truncation occurs.
   *
   * @param {Node} node - Text node to apply highlighting to
   * @param {string} className - CSS class name to apply
   * */
  surroundWhole_(node: Node, className: string): void {
    dom.createHighlightElement(node, className);
  }
}

export default TextRange;
