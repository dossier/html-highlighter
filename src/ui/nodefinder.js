/* eslint-disable camelcase */
import { is_$, is_str, is_fn } from '../util.js';

/**
 * Locator of nodes by specified criteria
 */
class NodeFinder {
  constructor(tag, prefix, root) {
    this.tag_ = tag;
    this.prefix_ = ['[', tag, '="', prefix && prefix.length > 0 ? prefix + '-' : ''].join('');
    this.root_ = root;
  }

  get root() {
    return this.root_;
  }

  find(scope, parent /* = prefix */) {
    let p;

    if (is_$(parent)) {
      p = parent;
    } else if (is_str(parent)) {
      p = this.find(parent);
    } else {
      p = this.root_;
    }

    return p.find([this.prefix_, scope, '"]'].join(''));
  }

  withroot(newRoot, callback) {
    if (!is_fn(callback)) {
      throw new Error('Invalid or no callback function specified');
    }

    const t = this.root_;
    let v;
    this.root_ = newRoot;
    v = callback.call(this);
    this.root_ = t;
    return v;
  }
}

export default NodeFinder;
