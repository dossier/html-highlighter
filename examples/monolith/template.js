/* global $ */
/* eslint-disable no-use-before-define */

import { is$, isStr } from './util';

/**
 * Locator of templates by ID
 */
class TemplateFinder {
  constructor(type, tag) {
    this.scripts = Array.prototype.slice
                        .call(document.getElementsByTagName('script'), 0)
                        .filter(function(i) {
                          return i.type === type;
                        });

    this.tag = tag || 'data-scope';
  }

  find(id) {
    for (let i = 0, l = this.scripts.length; i < l; ++i) {
      if (this.scripts[i].id === id) {
        return new Template(this.scripts[i].innerHTML, this.tag);
      }
    }

    return null;
  }
}

/**
 * Blueprint of a template
 */
class Template {
  constructor(html, tag) {
    this.html = html;
    this.tag = tag || null;
  }

  clone() {
    return new TemplateInstance($(this.html), this.tag);
  }
}

/**
 * Template instance
 */
class TemplateInstance {
  constructor(node, tag) {
    this.node = node;
    this.tag = tag || null;
  }

  get() {
    return this.node;
  }

  find(scope) {
    if (this.prefix === null) {
      return $();
    }

    return this.node.find(`[${this.tag}=${scope}]`);
  }
}

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

    if (is$(parent)) {
      p = parent;
    } else if (isStr(parent)) {
      p = this.find(parent);
    } else {
      p = this.root_;
    }

    return p.find([this.prefix_, scope, '"]'].join(''));
  }

  withroot(newRoot, callback) {
    const t = this.root_;
    let v;
    this.root_ = newRoot;
    v = callback.call(this);
    this.root_ = t;
    return v;
  }
}

export {TemplateFinder, NodeFinder};
