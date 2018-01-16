import $ from 'jquery';

import TemplateInstance from './templateinstance';

/**
 * @class
 */
class Template {
  constructor(html, tag) {
    this.html = html;
    this.tag = tag || null;

    Object.defineProperty(this, 'html', { value: html });
  }

  clone() {
    return new TemplateInstance($(this.html), this.tag);
  }
}

export default Template;
