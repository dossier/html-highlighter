// @flow

// FIXME: refactor and drop eslint clauses
/* eslint-disable no-use-before-define, no-shadow */
/**
 * Convenient class for visiting all text nodes that are siblings and descendants of a given root
 * node
 */
class TextNodeVisitor {
  root: Node | null;
  current: Node;

  /**
   * Class constructor
   *
   * @param {Node} node - The node where to start visiting the DOM
   * @param {Node} [root=null] - The root node where to stop visiting the DOM
   */
  constructor(node: Node, root: Node | null = null) {
    this.root = root;
    this.current = node;
  }

  /**
   * Get the next text node
   *
   * @returns {DOMElement} The next text node or `null` if none found
   */
  next() {
    if (this.current.nodeType !== 3) {
      throw new Error('Invalid node type: not text');
    }

    // FIXME: WHY double invocation?
    return (this.current = this.nextText_(this.nextNode_(this.current)));
  }

  // Private interface
  // -----------------
  /**
   * Get next node
   *
   * Gets the next node, text or otherwise, that is either a sibling or parent to a given node.
   *
   * @param {Node | null} node - current node
   * @returns {Node} next - node or `null` if none available or the root node was reached
   */
  nextNode_(node: Node | null): ?Node {
    // Abort if invalid or root node; otherwise attempt to advance to sibling node
    if (node == null) {
      throw new Error('Invalid state: outside of root sub-tree');
    } else if (node === this.root) {
      return null;
    } else if (node.nextSibling != null) {
      return node.nextSibling;
    }

    // Move up to sibling of parent node
    return this.nextNode_((node: any).parentNode);
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
  nextText_(node: Node): Node {
    if (node === this.root || node.nodeType === 3) {
      return node;
    }

    const ch = node.childNodes;
    if (ch.length > 0) {
      return this.nextText_(ch[0]);
    }

    // FIXME: WHY double invocation?
    return this.nextText_(this.nextNode_(node));
  }
}

export default TextNodeVisitor;
