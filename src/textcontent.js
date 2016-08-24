import $ from "jquery";

import HtmlHighlighter from "./htmlhighlighter.js";
import {is_$} from "./util.js";

/**
 * <p>Class responsible for building and keeping a convenient representation
 * of the text present in an HTML DOM sub-tree.</p>
 * @class
 * @param {DOMElement|jQuery} root - Reference to a DOM element or jQuery
 * instance.  If a jQuery instance is given, its first element is used.
 * */
class TextContent
{
  constructor(root)
  {
    this.root = is_$(root) ? root.get(0) : root;
    this.text = this.markers = null;
    this.refresh();
  }

  /**
   * <p>Refreshes the internal representation of the text.</p>
   *
   * <p>The internal representation of the text present in the DOM sub-tree of
   * the <code>root</code> consists of an array of global offsets for every
   * text node in the document, and a reference to the corresponding text node,
   * stored in <i>marker</i> descriptors. In addition, a regular string
   * (<code>text</code>) holds the text contents of the document to enable
   * text-based searches.</p>
   *
   * <p>A marker descriptor is of the form:</p>
   * <pre>{
   *   node:   DOMElement  // reference to DOMElement of text node
   *   offset: integer     // global offset
   * }</pre>
   *
   * <p>Should only be invoked when the HTML structure mutates, e.g. a new
   * document is loaded.</p>
   * */
  refresh()
  {
    this.text = "";
    let markers = this.markers = [];
    const offset = this.visit_(this.root, 0);

    /* FIXME: bypass when not in debug mode. */
    /* Sanity check. */
    if(this.markers.length !== 0) {
      const marker = markers[markers.length - 1];
      if(offset - marker.node.nodeValue.length != marker.offset) {
        throw new Error("Invalid state detected: offset mismatch");
      }
    }
  }

  /**
   * <p>Truncate a text node given by <code>marker</code> by turning it into 2
   * or 3 text nodes, with one of them used for highlighting purposes.</p>
   *
   * <p>If <code>start == 0</code> and <code>end == text.length - 1</code>, no
   * truncation takes place <strong>but</strong> the old text node is replaced
   * by a new one.  This method therefore assumes that the caller has checked
   * to ensure text truncation is required.</p>
   *
   * <p>Truncation takes place in the following manner:</p>
   *
   * <ul><li>if <code>start > 0</code>: truncate <code>[ 0 .. start - 1
   * ]</code></li>
   *
   * <li>create new text node at <code>[ start .. end ]</code></li>
   *
   * <li>if <code>end != text.length - 1</code>: truncate <code>[ end
   * .. text.length - 1 ]</code></li></ul>
   *
   * @param {Object} marker - Reference to descriptor of text node to
   * truncate.
   * @param {number} start - Offset where to start truncation.
   * @param {number} end - Offset where truncation ends. */
  truncate(marker, start, end)
  {
    const text = marker.node.nodeValue;
    let index = this.indexOf(marker.offset);
    let old = marker.node;      /* The old text node. */

    /* Sanity checks */
    if(start < 0 || end < 0 || end >= text.length) {
      throw new Error("Invalid truncation parameters");
    }

    /* Chars 0..start - 1 */
    if(start > 0) {
      /* Since we're creating a new text node out of the old text node, we need
       * to add a new entry to the markers array. */
      this.markers.splice(index, 0, {
        offset: marker.offset,
        node: $(document.createTextNode(text.substr(0, start)))
          .insertBefore(marker.node).get(0)
      });

      ++index;
    }

    /* Chars start..end
     * ----------------
     * We don't need to add a new entry to the markers array since we're not
     * technically creating a new text node, just replacing it with one with
     * the required [start..end] substring.  We do need to update the node's
     * offset though. */
    marker.offset += start;
    marker.node = $(
      document.createTextNode(text.substr(start, end - start + 1))
    ).insertBefore(marker.node)
      .get(0);

    /* Chars end + 1..length */
    if(end !== text.length - 1) {
      if(index >= this.markers.length) {
        throw new Error("Detected invalid index");
      }

      /* We're again creating a new text node out of the old text node and thus
       * need to add a new entry to the markers array. */
      this.markers.splice(index + 1, 0, {
        offset: marker.offset + end - start + 1,
        node: $(document.createTextNode(text.substr(end + 1)))
          .insertAfter(marker.node).get(0)
      });
    }

    /* From global state since we don't have access to the `options`
     * descriptor. */
    if(HtmlHighlighter.debug) this.assert_();

    /* Remove old node. */
    old.parentNode.removeChild(old);

    return index;
  }

  /**
   * <p>Return the index of the marker descriptor of a given text offset.</p>
   *
   * <p>Throws an exception if the offset is invalid.</p>
   *
   * <p>Note: employs the binary search algorithm.</p>
   *
   * @param {number} offset - The offset to look up.
   * @returns {number} The marker index that contains <code>offset</code>. */
  indexOf(offset)
  {
    const markers = this.markers;
    let min = 0,
        max = markers.length - 1;

    while(min < max) {
      const mid = Math.floor((min + max) / 2);

      if(markers[mid].offset < offset) min = mid + 1;
      else                             max = mid;
    }

    if(markers[min].offset <= offset) {
      return min;
    } else if(min === 0) {
      throw new Error("Invalid offset of text content state");
    }

    return min - 1;
  }

  /**
   * <p>Find the index of the marker descriptor of a given text node
   * element.</p>
   *
   * @param {DOMElement} element - Reference to the text node to look up.
   * @param {number} [start=0] - Start marker index if known for a fact that
   * the text node is to be found <strong>after</strong> a certain offset.
   *
   * @returns {number} The marker index of <code>element</code> or
   * <code>-1</code> if not found. */
  find(element, start)
  {
    if(element.nodeType !== 3) return -1;

    for(let i = start === undefined ? 0 : start,
            l = this.markers.length; i < l; ++i)
    { if(this.markers[i].node === element) return i; }

    return -1;
  }

  /**
   * <p>Return the offset marker descriptor at a given index.</p>
   *
   * <p>Throws an exception if the given <code>index</code> is out of
   * bounds.</p>
   *
   * @param {number} index - Marker index.
   * @returns {Object} The offset marker descriptor. */
  at(index)
  {
    if(index < 0 || index >= this.markers.length) {
      throw new Error("Invalid marker index");
    }

    return this.markers[index];
  }

  /**
   * <p>Recursively build a representation of the text contained in the HTML
   * DOM sub-tree in the form of a string containing the text and global
   * offsets of each text node.</p>
   * @access private
   *
   * @param {DOMElement} node - The node to visit. */
  visit_(node, offset)
  {
    /* Only interested in text nodes. */
    if(node.nodeType === 3) {
      const content = node.nodeValue;
      const length = content.length;

      /* Save reference to text node and store global offset in the markers
       * array, in addition to . */
      this.markers.push({ node: node, offset: offset });
      this.text += content;
      return offset + length;
    }

    /* If current node is not of type text, process its children nodes, if
     * any. */
    const ch = node.childNodes;
    if(ch.length > 0) {
      for(let i = 0, l = ch.length; i < l; ++i) {
        offset = this.visit_(ch[i], offset);
      }
    }

    return offset;
  }

  /**
   * <p>Debug method for asserting that the current textual representation if
   * valid, in particular that the offset markers are all contiguous.</p> */
  assert_()
  {
    let offset = 0;

    /* Ensure offsets are contiguous. */
    for(let i = 0, l = this.markers.length; i < l; ++i) {
      const marker = this.markers[i];

      if(marker.offset !== offset) {
        console.error("Invalid offset: %d@ %d:%d ->",
                      i, marker.offset, offset, marker);
        throw new Error("Invalid offset");
      }

      offset += marker.node.nodeValue.length;
    }
  }
}

export default TextContent;