/* FIXME: refactor and remove. */

/**
 * @class
 * */
var TemplateInstance = function(node, tag)
{
  this.node = node;
  this.tag = tag || null;
};

TemplateInstance.prototype.get = function() { return this.node; };

TemplateInstance.prototype.find = function(scope)
{
  if(this.prefix === null) return $();
  return this.node.find("[" + this.tag + "=" + scope + "]");
};

export default TemplateInstance;