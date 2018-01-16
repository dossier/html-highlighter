// FIXME: refactor and drop eslint clauses
/* eslint-disable no-use-before-define, no-shadow */
/**
 * Convenient class for visiting all text nodes that are siblings and descendants of a given root
 * node
 * @class
 *
 * @param {DOMElement} node - The node where to start visiting the DOM
 * @param {DOMElement} [root=null] - The root node where to stop visiting the DOM
 */
function TextNodeVisitor(node, root) {
  // Attributes
  let current = node;

  // Getters
  Object.defineProperty(this, 'current', {
    get: function() {
      return current;
    },
  });

  /**
   * Get the next text node
   *
   * @returns {DOMElement} The next text node or `null` if none found
   */
  this.next = function() {
    if (current.nodeType !== 3) {
      throw new Error('Invalid node type: not text');
    }

    return (current = nextText_(nextNode_(current)));
  };

  // Private interface
  // -----------------
  /**
   * Get next node
   *
   * Gets the next node, text or otherwise, that is either a sibling or parent to a given node.
   *
   * @param {DOMElement} node current node
   * @returns {DOMElement} next node or `null` if none available or the root node was reached
   */
  function nextNode_(node) {
    // Abort if invalid or root node; otherwise attempt to advance to sibling node
    if (node === null) {
      throw new Error('Invalid state: outside of root sub-tree');
    } else if (node === root) {
      return null;
    } else if (node.nextSibling !== null) {
      return node.nextSibling;
    }

    // Move up to sibling of parent node
    return nextNode_(node.parentNode);
  }

  /**
   * Get next text node
   *
   * Get the next available text node that is either a descendant, sibling or otherwise, of a given
   * node.
   *
   * @param {DOMElement} node current node.
   * @returns {DOMElement} next node or `null` if none available or the root node was reached
   */
  function nextText_(node) {
    if (node === root || node.nodeType === 3) {
      return node;
    }

    const ch = node.childNodes;
    if (ch.length > 0) {
      return nextText_(ch[0]);
    }

    return nextText_(nextNode_(node));
  }
}

export default TextNodeVisitor;
