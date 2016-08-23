/* FIXME: refactor and remove. */
import TemplateInstance from "./templateinstance.js";

/**
 * @class
 * */
var Template = function(html, tag)
{
  this.html = html;
  this.tag = tag || null;

  Object.defineProperty(this, "html", { value: html });
};

Template.prototype.clone = function()
{
  return new TemplateInstance($(this.html), this.tag);
};

export default Template;