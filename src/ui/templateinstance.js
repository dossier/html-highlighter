import $ from 'jquery';

/**
 * Represents a template instance
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

export default TemplateInstance;
