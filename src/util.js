import TextFinder from "./textfinder.js";
import XpathFinder from "./xpathfinder.js";

export function absm_noti()
{ throw new Error("Abstract method not implemented"); }

export function is_$(el) { return el instanceof $; }
export function is_fn(r) { return typeof r === 'function'; }
export function is_arr(r) { return r instanceof Array; }
export function is_obj(r) { return r !== null && typeof r === "object"; }
export function is_str(r)
{ return typeof r === "string" || r instanceof String; }

export function like_obj(r) { return r instanceof Object; }

export function is_obj_empty(x)
{
  if(!like_obj(x)) {
    throw new Error("Reference not provided or not an object");
  }

  return Object.keys(x).length === 0;
}

export function inview(el)
{
  const $window = $(window);
  const docTop = $window.scrollTop();
  const docBottom = docTop + $window.height();
  const top = el.offset().top;
  const bottom = top + el.height();

  return((bottom <= docBottom) && (top >= docTop));
}

export function scrollIntoView(el, c)
{
  const container = c === undefined ? $(window) : c;
  const containerTop = container.scrollTop();
  const containerBottom = containerTop + container.height();
  const elemTop = el.offset().top;
  const elemBottom = elemTop + el.height();

  if(elemTop < containerTop) {
    container.off().scrollTop(elemTop);
  } else if(elemBottom > containerBottom) {
    container.off().scrollTop(elemBottom - container.height());
  }
}

/**
 * <p>Construct appropriate <code>Finder</code>-derived class for a given
 * subject.</p>
 * @static
 *
 * @param {TextContent} content - reference to <code>TextContent</code>
 * holding a text representation of the document.
 * @param {*} subject - subject to find; can be of any type.
 * */
export function constructFinder(content, subject)
{
  return is_str(subject) || subject instanceof RegExp
    ? new TextFinder(content, subject)
    : new XpathFinder(content, subject);
}
