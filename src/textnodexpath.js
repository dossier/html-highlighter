/* eslint-disable camelcase */
import { Css } from './consts.js';
import { is_$ } from './util.js';

/**
 * This class builds XPath representations of text nodes, optionally within a DOM sub-tree.  If a
 * root node is specified, the XPath produced will include the elements up to but **not** including
 * said root node.
 *
 * @param {DOMElement} [root=null] - Root DOM node
 */
class TextNodeXpath {
  constructor(root) {
    this.root = root || null;
    if (is_$(this.root)) {
      this.root = this.root.get(0);
    }
  }

  /**
   * Compute the XPath representation of a text node
   *
   * The XPath produced of the text node is fully normalised and unaffected by the current state of
   * text node fragmentation caused by the presence of highlight containers.
   *
   * Throws an exception if `node` is <strong>not</strong> a text node.
   *
   * @param {DOMElement} node - Text node to compute XPath representation of
   * @returns {string} XPath representation
   */
  xpathOf(node) {
    // Note: no checks required since `indexOfText_´ throws exception if node invalid: null or not
    // like text.
    let xpath = '/text()[' + this.indexOfText_(node) + ']';

    // Skip all text or highlight container nodes
    /* eslint-disable curly */
    for (
      node = node.parentNode;
      node !== null && node !== this.root && this.isLikeText_(node);
      node = node.parentNode
    );
    /* eslint-enable curly */

    // Start traversing upwards from `node´'s parent node until we hit `root´ (or null)
    for (; node !== null && node !== this.root && node.nodeType === 1; node = node.parentNode) {
      const id = this.indexOfElement_(node);
      xpath = '/' + node.nodeName.toLowerCase() + '[' + id + ']' + xpath;
    }

    if (node === null) {
      throw new Error("Specified node not within root's subtree");
    }

    return xpath;
  }

  /**
   * Compute element referenced by an XPath string
   *
   * The element computed is the same that would result from traversing a DOM sub-tree fully
   * normalised and thus unaffected by text node fragmentation caused by the presence of highlight
   * containers.
   *
   * @param {string} xpath - String containing XPath representation
   * @returns {DOMElement} The element referenced by the XPath string
   * */
  elementAt(xpath) {
    const parts = xpath.split('/');
    let part;
    let cur = this.root; /* start from the root node */

    // At an absolute minimum, a XPath representation must be of the form: /text(), which results
    // in `parts´ having a length of 2.
    if (parts[0].length !== 0 || parts.length < 2) {
      throw new Error('Invalid XPath representation');
    }

    // Break up the constituent parts of the XPath representation but discard the first element
    // since it'll be empty due to the starting forward slash in the XPath string.
    let i = 1;
    for (const l = parts.length - 1; i < l; ++i) {
      part = this.xpathPart_(parts[i]);
      cur = this.nthElementOf_(cur, part.tag, part.index);
      if (cur === null) {
        // This, we would hope, would be indicative that the tree mutated.  Otherwise, either this
        // algorithm is flawed or the reverse operation is.
        console.error('Failed to find nth child:', part, cur);
        return null;
      }
    }

    // Now process the text element given by `parts[i]`.
    part = parts[i].trim();
    if (part.length === 0) {
      throw new Error(
        `XPath part cannot be empty. As an example, the form \`//tag\` is not currently
allowed.  Offending XPath representation: ${xpath}`
      );
    }

    part = this.xpathPart_(parts[i]);
    cur = part.tag === 'text()' ? this.nthTextOf_(cur, part.index) : null;

    if (cur === null || cur.nodeType !== 3) {
      console.error('Element at specified XPath NOT a text node: %s', xpath, part, cur);
      return null;
    }

    return cur;
  }

  /**
   * Calculate the relative offset from a specified text node
   * (`node`) to the start of the first **sibling**
   * text node in a set of contiguous text or highlight container nodes.
   *
   * For example, given the post-highlight, non-normalised, child contents
   * of an arbitrary element:
   *
   *   `#text + SPAN.hh-highlight + #text + STRONG`
   *
   * If this method were invoked with `node` containing a
   * reference to the third `#text` element, the computed offset
   * would be the length of the `SPAN` to its left plus the length
   * of the first `#text`.  This because the normalised version --
   * pre-highlight, that is -- of the above would be:
   *
   *   `#text + STRONG`
   *
   * @param {HTMLElement} node - Text node
   * @returns {number} Offset of text node
   */
  offset(node) {
    let offset = 0;

    if (!node || node.nodeType !== 3) {
      throw new Error('Invalid or no text node specified');
    }

    /* eslint-disable no-constant-condition */
    // Climb the tree of nested highlight containers in a left to right order, if any, calculating
    // their respective lengths and adding to the overall offset.
    while (true) {
      while (node.previousSibling === null) {
        node = node.parentNode;
        if (node === this.root || node === null) {
          throw new Error('Invalid state: expected highlight container or text node');
        } else if (!this.isHighlight_(node)) {
          return offset;
        } else if (node.previousSibling !== null) {
          break;
        }
      }

      node = node.previousSibling;
      if (!this.isLikeText_(node)) {
        break;
      }

      offset += this.length_(node);
    }
    /* eslint-enable no-constant-condition */

    return offset;
  }

  /**
   * Calculate the length of all text nodes in a specified sub-tree
   *
   * Note that no checks are made to ensure that the node is either a
   * highlight container or text node.  Caller is responsible for invoking this
   * method in the right context.
   *
   * @access private
   * @param {DOMElement} node - text node or **highlight** container
   * @returns {integer} Combined length of text nodes
   */
  length_(node) {
    if (node.nodeType === 3) {
      return node.nodeValue.length;
    }

    // If `node´ isn't of text type, it is *assumed* to be a highlight container.  No checks are
    // made to ensure this is the case.  Caller is responsible!
    const ch = node.childNodes;
    let length = 0;

    // We loop recursively through all child nodes because a single highlight container may be
    // parent to multiple highlight containers.
    for (let i = 0, l = ch.length; i < l; ++i) {
      length += this.length_(ch[i]);
    }

    return length;
  }

  /**
   * Skip to first highlight container parent of a specified node, if it is of text type
   *
   * @param {DOMElement} node - text node.
   * @returns {DOMElement} First highlight container of text node, if applicable.
   */
  skip_(node) {
    // Don't do anything if node isn't of text type
    if (node.nodeType === 3) {
      /* eslint-disable no-constant-condition */
      while (true) {
        // Skip to first highlight container element
        const parent = node.parentNode;
        if (parent === this.root || !this.isHighlight_(parent)) {
          break;
        }
        node = parent;
      }
      /* eslint-enable no-constant-condition */
    }

    return node;
  }

  /**
   * Return boolean value indicative of whether a given node is a highlight container
   * @access private
   *
   * @param {DOMElement} node - DOM element to check
   * @returns {boolean} `true` if it is a highlight container
   */
  isHighlight_(node) {
    // NOTE: this is potentially problematic if the document uses class names that contain or are
    // equal to `Css.highlight´.
    return node.nodeName.toLowerCase() === 'span' && node.className.indexOf(Css.highlight) !== -1;
  }

  /**
   * Return the XPath index of an arbitrary element node, excluding text nodes, relative to its
   * sibling nodes
   *
   * Note that XPath indices are **not** zero-based.
   *
   * @access private
   * @param {DOMElement} node - DOM element to calculate index of
   * @returns {number} Index of node plus one
   */
  indexOfElement_(node) {
    const name = node.nodeName.toLowerCase();
    let index = 1;

    if (node === null || this.isLikeText_(node)) {
      throw new Error('No node specified or node of text type');
    }

    while ((node = node.previousSibling) !== null) {
      // Don't count contiguous text nodes or highlight containers as being separate nodes.  IOW,
      // contiguous text nodes or highlight containers are treated as ONE element.
      if (!this.isLikeText_(node) && node.nodeName.toLowerCase() === name) {
        ++index;
      }
    }

    return index;
  }

  /**
   * Return the XPath index of an arbitrary **text** node, excluding element nodes, relative to its
   * sibling nodes.
   *
   * Since text nodes are liable to be truncated to enable highlight of a substring of text, this
   * method counts contiguous text nodes and highlight container elements as one, e.g.:
   *
   * ```
   * #text + STRONG + #text + SPAN.highlight
   * ```
   *
   * In the example above, the index of the third node is the same as the
   * fourth node's, or 3.  More clearly:
   *
   * ```
   * 1, 2, 3, 3
   * ```
   *
   * Note that XPath indices are **not** zero-based.
   *
   * @access private
   * @param {DOMElement} node - DOM element to calculate index of.
   * @returns {number} Index of node plus one.
   */
  indexOfText_(node) {
    let index = 1,
      wast = true;

    if (node === null || !this.isLikeText_(node)) {
      throw new Error('No node specified or not of text type');
    }

    node = this.skip_(node);
    while ((node = node.previousSibling) !== null) {
      // Don't count contiguous text nodes or highlight containers as being separate nodes.  IOW,
      // contiguous text nodes or highlight containers are treated as ONE element.
      if (this.isLikeText_(node)) {
        if (wast) {
          continue;
        } else {
          wast = true;
        }
        ++index;
      } else {
        wast = false;
      }
    }

    return index;
  }

  /**
   * Return `true` if specified node is either of text type or a highlight container, thus like a
   * text node
   *
   * @param {DOMElement} node - node to check
   * @returns {boolean} - `true` if node is of text type of highlight container
   */
  isLikeText_(node) {
    return node.nodeType === 3 || this.isHighlight_(node);
  }

  /**
   * Return an object map containing a tag and index of an XPath representation part
   *
   * Exceptions may be thrown if the regular expression matcher encounters an unrecoverable error
   * of if the index in the XPath part is less than 1.
   *
   * Object returned is of the form:
   * ```
   * {
   *   tag: string,
   *   index: integer
   * }
   * ```
   *
   * @param {string} part - An XPath representation part; e.g. "div[2]", "text()[3]" or "p"
   * @returns {Object} Object containing tag and index
   */
  xpathPart_(part) {
    let index;

    // If no index specified: assume first
    if (part.indexOf('[') === -1) {
      return { tag: part.toLowerCase(), index: 0 };
    }

    // *Attempt* to retrieve element's index.  If an exception is thrown, produce a meaningful
    // error but re-throw since the XPath representation is clearly invalid.
    try {
      part = part.match(/([^[]+)\[(\d+)\]/);
      index = parseInt(part[2], 10);
      part = part[1];
      if (--index < 0) {
        throw new Error('Invalid index: ' + index);
      }
    } catch (x) {
      console.error('Failed to extract child index: %s', part);
      throw x; /* Re-throw after dumping inspectable object. */
    }

    return { tag: part.toLowerCase(), index: index };
  }

  /**
   * Find the nth child element of a specified node, **excluding** text nodes
   *
   * @param {DOMElement} parent - node whose children to search
   * @param {string} tag - the tag name of the node sought in **lowercase** form
   * @param {integer} index - child index of the node sought
   *
   * @returns {DOMElement} The nth element of `node`
   */
  nthElementOf_(parent, tag, index) {
    const ch = parent.children;
    let node;

    for (let i = 0, l = ch.length; i < l; ++i) {
      node = ch[i];

      // Skip highlight containers since tag could be `span´, the same as highlight containers.
      if (this.isHighlight_(node)) {
        continue;
      } else if (node.nodeName.toLowerCase() === tag) {
        if (index === 0) {
          return node;
        }
        --index;
      }
    }

    console.error("Failed to locate tag '%s' at index %d", tag, index);
    return null;
  }

  /**
   * Find the nth normalised text node within a specified element node
   *
   * @param {DOMElement} parent - node whose children to search
   * @param {integer} index - child index of the node sought
   *
   * @returns {DOMElement} `null` if no match or element node
   */
  nthTextOf_(parent, index) {
    let node;
    let wast = false;
    let ch = parent.childNodes;

    for (let i = 0, l = ch.length; i < l; ++i) {
      node = ch[i];

      // Don't count contiguous text or highlight container nodes and ignore non-text nodes
      if (this.isLikeText_(node)) {
        if (wast) {
          continue;
        } else {
          wast = true;
        }
      } else {
        wast = false;
        continue;
      }

      // We have got a potential match when `index´ === 0
      if (index === 0) {
        // Skip to first text node if currently on a highlight container
        while (this.isHighlight_(node)) {
          ch = node.childNodes;
          if (ch.length === 0 || !this.isLikeText_(ch[0])) {
            throw new Error(
              'Invalid state: expected text node or highlight container inside container'
            );
          }

          node = ch[0];
        }

        // Ensure tag sought after is the right one
        if (node.nodeType !== 3) {
          console.error('Failed to locate text node at index %d', index);
          return null;
        }

        return node;
      }

      --index;
    }

    // No match!
    return null;
  }
}

export default TextNodeXpath;
