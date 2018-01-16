// @flow

/**
 * Convenient class for visiting all text nodes that are siblings and descendants of a given root
 * node
 */
class TextNodeVisitor {
  root: Node;
  current: ?Node;

  /**
   * Class constructor
   *
   * @param {Node} node - The node where to start visiting the DOM
   * @param {Node} [root=null] - The root node where to stop visiting the DOM
   */
  constructor(node: Node, root: ?Node) {
    if (root == null) {
      if (document.body == null) {
        throw new Error('document body not defined');
      }

      this.root = document.body;
    } else {
      this.root = root;
    }

    this.current = node;
  }

  /**
   * Get the next text node
   *
   * @returns {Node} The next text node or `null` if none found
   */
  next(): ?Node {
    const cur = this.current;
    if (cur == null || cur.nodeType !== 3) {
      throw new Error('No current node or not text node');
    }

    // Using `any` below to silence flow because of sanity check above
    const node = this.nextNode_((this.current: any));
    return node != null ? (this.current = this.nextText_(node)) : null;
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
   * @param {Node} node - current node.
   * @returns {Node} next - node or `null` if none available or the root node was reached
   */
  nextText_(node: Node): ?Node {
    if (node === this.root || node.nodeType === 3) {
      return node;
    }

    const ch = node.childNodes;
    if (ch.length > 0) {
      return this.nextText_(ch[0]);
    }

    const next = this.nextNode_(node);
    return next != null ? this.nextText_(next) : null;
  }
}

export default TextNodeVisitor;
