/* FIXME: refactor and remove. */
import Template from './template.js';

/**
 * @class
 * */
var TemplateFinder = function(type, tag) {
  this.scripts = Array.prototype.slice
    .call(document.getElementsByTagName('script'), 0)
    .filter(function(i) {
      return i.type === type;
    });

  this.tag = tag || 'data-scope';
};

TemplateFinder.prototype.find = function(id) {
  for (let i = 0, l = this.scripts.length; i < l; ++i) {
    if (this.scripts[i].id === id) return new Template(this.scripts[i].innerHTML, this.tag);
  }

  return null;
};

export default TemplateFinder;
