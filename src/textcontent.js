// @flow

import globals from './globals';
import * as dom from './dom';
import logger from './logger';

export type Marker = {| node: Node, offset: number |};
export type MarkerArray = Array<Marker>;

/**
 * Class responsible for building and keeping a convenient representation
 * of the text present in an HTML DOM sub-tree.
 */
class TextContent {
  root: HTMLElement;
  text: string;
  // FIXME: add type
  markers: MarkerArray;

  /**
   * Class constructor
   * @param {Node|jQuery} root - Reference to a DOM element
   */
  constructor(root: HTMLElement) {
    this.root = root;
    this.text = '';
    this.markers = [];
    this.refresh();
  }

  /**
   * Refresh internal representation of the text
   *
   * The internal representation of the text present in the DOM sub-tree of the `root` consists of
   * an array of global offsets for every text node in the document, and a reference to the
   * corresponding text node, stored in marker descriptors. In addition, a regular string (`text`)
   * holds the text contents of the document to enable text-based searches.
   *
   * A marker descriptor is of the form:
   * ```
   * {
   *   node:   Node      // reference to text node
   *   offset: integer   // global offset
   * }
   * ```
   *
   * Should only be invoked when the HTML structure mutates, e.g. a new document is loaded.
   * */
  refresh(): void {
    this.text = '';
    let markers = (this.markers = []);
    const offset = this.visit_(this.root, 0);

    // Sanity check
    if (globals.debugging) {
      if (this.markers.length !== 0) {
        const marker = markers[markers.length - 1];
        if (offset - marker.node.nodeValue.length !== marker.offset) {
          throw new Error('Invalid state detected: offset mismatch');
        }
      }
    }
  }

  /**
   * Truncate text node
   *
   * Truncates a text node given by `marker` by turning it into 2 or 3 text nodes, with one of them
   * used for highlighting purposes.
   *
   * If `start == 0` and `end == text.length - 1`, no truncation takes place **but** the old text
   * node is replaced by a new one.  This method therefore assumes that the caller has checked to
   * ensure text truncation is required.
   *
   * Truncation takes place in the following manner:
   *
   *  - if `start > 0`: truncate `[ 0 .. start - 1 ]
   *  - create new text node at `[ start .. end ]`
   *  - if `end != text.length - 1`: truncate `[ end .. text.length - 1 ]`
   *
   * @param {Marker} marker - Reference to descriptor of text node to truncate
   * @param {number} start - Offset where to start truncation
   * @param {number} end - Offset where truncation ends
   *
   * @returns {number} Index of marker descriptor
   */
  truncate(marker: Marker, start: number, end: number): number {
    const text = marker.node.nodeValue;
    let index = this.indexOf(marker.offset);
    let old = marker.node; // The old text node

    // Sanity checks
    if (start < 0 || end < 0 || end >= text.length) {
      throw new Error('Invalid truncation parameters');
    }

    // Chars 0..start - 1
    if (start > 0) {
      const node = document.createTextNode(text.substr(0, start));
      // Since we're creating a new text node out of the old text node, we need to add a new entry
      // to the markers array
      this.markers.splice(index, 0, {
        offset: marker.offset,
        node: dom.insertBefore(node, marker.node),
      });

      ++index;
    }

    // Chars start..end
    // ----------------
    // We don't need to add a new entry to the markers array since we're not technically creating a
    // new text node, just replacing it with one with the required [start..end] substring.  We do
    // need to update the node's offset though.
    marker.offset += start;
    marker.node = dom.insertBefore(
      document.createTextNode(text.substr(start, end - start + 1)),
      marker.node
    );

    // Chars end + 1..length
    if (end !== text.length - 1) {
      if (index >= this.markers.length) {
        throw new Error('Detected invalid index');
      }

      // We're again creating a new text node out of the old text node and thus need to add a new
      // entry to the markers array.
      this.markers.splice(index + 1, 0, {
        offset: marker.offset + end - start + 1,
        node: dom.insertAfter(document.createTextNode(text.substr(end + 1)), marker.node),
      });
    }

    if (globals.debugging) {
      this.assert();
    }

    // Remove old node.
    (old.parentNode: any).removeChild(old);
    return index;
  }

  /**
   * Return the index of the marker descriptor of a given text offset.
   *
   * Throws an exception if the offset is invalid.
   *
   * Note: employs the binary search algorithm.
   *
   * @param {number} offset - The offset to look up
   * @returns {number} The marker index that contains `offset`
   */
  indexOf(offset: number): number {
    const markers = this.markers;
    let min = 0;
    let max = markers.length - 1;

    while (min < max) {
      const mid = Math.floor((min + max) / 2);

      if (markers[mid].offset < offset) {
        min = mid + 1;
      } else {
        max = mid;
      }
    }

    if (markers[min].offset <= offset) {
      return min;
    } else if (min === 0) {
      throw new Error('Invalid offset of text content state');
    }

    return min - 1;
  }

  /**
   * Find the index of the marker descriptor of a given text node element
   *
   * @param {Node} element - Reference to the text node to look up
   * @param {number} [start=0] - Start marker index if known for a fact that the text node is to be
   * found **after** a certain offset
   *
   * @returns {number} The marker index of `element` or `-1` if not found.
   */
  find(element: Node, start: ?number = 0): number {
    if (element.nodeType !== 3) {
      return -1;
    }

    for (
      let i = start == null ? 0 : start, l = this.markers.length;
      i < l;
      ++i // eslint-disable-line indent
    ) {
      if (this.markers[i].node === element) {
        return i;
      }
    }

    return -1;
  }

  /**
   * Return the offset marker descriptor at a given index
   *
   * Throws an exception if the given `index` is out of bounds.
   *
   * @param {number} index - Marker index
   * @returns {Marker} The offset marker descriptor
   */
  at(index: number): Marker {
    if (index < 0 || index >= this.markers.length) {
      throw new Error('Invalid marker index');
    }

    return this.markers[index];
  }

  visit_(node: Node, offset: number): number {
    // Only interested in text nodes
    if (node.nodeType === 3) {
      const content = node.nodeValue;
      const length = content.length;

      // Save reference to text node and store global offset in the markers array
      this.markers.push({ node: node, offset: offset });
      this.text += content;
      return offset + length;
    }

    // If current node is not of type text, process its children nodes, if any.
    const ch = node.childNodes;
    if (ch.length > 0) {
      for (let i = 0, l = ch.length; i < l; ++i) {
        offset = this.visit_(ch[i], offset);
      }
    }

    return offset;
  }

  /**
   * Assert textual representation is valid
   *
   * Debug method for asserting that the current textual representation is valid, in particular
   * that the offset markers are all contiguous.
   */
  assert(): void {
    let offset = 0;

    // Ensure offsets are contiguous
    for (let i = 0, l = this.markers.length; i < l; ++i) {
      const marker = this.markers[i];

      if (marker.offset !== offset) {
        logger.error('invalid offset: %d@ %d:%d ->', i, marker.offset, offset, marker);
        throw new Error('Halting due to invalid offset');
      }

      offset += marker.node.nodeValue.length;
    }
  }
}

export default TextContent;
