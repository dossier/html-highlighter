// @flow
// FIXME: this module relies heavily on `document.querySelector` and `document.querySelectorAll`
// methods but suffers from the limitation that it (presently) runs the queries on the wider
// document's DOM.  This means that, should there ever be a use case for multiple HTML Highlighter
// instances running concurrently within the same DOM on separate subtrees, the result of doing so
// would most certainly be undefined and most likely confusing and resulting in loss or corruption
// of (perceived) state.

import { Css } from './consts';

export type Position = {| x: number, y: number |};
export type ForEachNodeCallback = Node => boolean;

function classNameToSet(el: HTMLElement): Set<string> {
  return new Set(
    el.className
      .split(' ')
      .map(c => c.trim())
      .filter(Boolean)
  );
}

function ensureIterable(
  elementOrCollection: HTMLElement | NodeList<HTMLElement>
): Iterable<HTMLElement> {
  return elementOrCollection instanceof NodeList
    ? elementOrCollection
    : new Set([elementOrCollection]);
}

function addClass(coll: HTMLElement | NodeList<HTMLElement>, name: string): void {
  for (const el of ensureIterable(coll)) {
    const set = classNameToSet(el);
    set.add(name);
    el.className = Array.from(set).join(' ');
  }
}

function removeClass(coll: HTMLElement | NodeList<HTMLElement>, name: string): void {
  for (const el of ensureIterable(coll)) {
    const set = classNameToSet(el);
    set.delete(name);
    el.className = Array.from(set).join(' ');
  }
}

function getHighlightElements(id: number): NodeList<HTMLElement> {
  return document.querySelectorAll(`.${Css.highlight}-id-${id}`);
}

function getForQuerySet(qid: number): NodeList<HTMLElement> {
  return document.querySelectorAll(`.${Css.highlight}-${qid}`);
}

function getAllHighlightElements(additionalClass: string | null = null): NodeList<HTMLElement> {
  const otherClass = additionalClass ? `.${additionalClass}` : '';
  return document.querySelectorAll(`.${Css.highlight}${otherClass}`);
}

function isHighlightVisible(id: number): boolean {
  const elements = getHighlightElements(id);
  if (elements.length < 1) {
    return false;
  }

  // A highlight is considered to be visible if its first (and usually only) element possesses
  // height and width greater than 0.
  const bbox = elements[0].getBoundingClientRect();
  return bbox.height > 0 && bbox.width > 0;
}

function createHighlightElement(node: HTMLElement | Node, className: string): HTMLElement {
  const span = document.createElement('span');
  span.className = className;
  (node.parentNode: any).insertBefore(span, node);
  span.appendChild(node);
  return span;
}

function insertBefore(newNode: Node, beforeNode: Node): Node {
  (beforeNode.parentNode: any).insertBefore(newNode, beforeNode);
  return newNode;
}

function insertAfter(newNode: Node, afterNode: Node): Node {
  // Automatically adds to the end of the list when `nextSibling` is `null`
  (afterNode.parentNode: any).insertBefore(newNode, afterNode.nextSibling);
  return newNode;
}

// Taken with a few alterations from:
// https://www.kirupa.com/html5/get_element_position_using_javascript.htm
function getOffset(el: HTMLElement): Position {
  let x = 0;
  let y = 0;

  while (el != null) {
    if (el.tagName.toLowerCase() === 'body') {
      // deal with browser quirks with body/window/document and page scroll
      const scrollX = el.scrollLeft || (document.documentElement: any).scrollLeft;
      const scrollY = el.scrollTop || (document.documentElement: any).scrollTop;

      x += el.offsetLeft - scrollX + el.clientLeft;
      y += el.offsetTop - scrollY + el.clientTop;
    } else {
      // for all other non-BODY elements
      x += el.offsetLeft - el.scrollLeft + el.clientLeft;
      y += el.offsetTop - el.scrollTop + el.clientTop;
    }

    el = (el: any).offsetParent;
  }

  return { x, y };
}

function isInView(el: HTMLElement): boolean {
  const bbox = el.getBoundingClientRect();
  return bbox.top >= 0 && bbox.top + bbox.height < window.innerHeight;
}

// Note that flow does not expose a formal Window type, which means we are unable to validate the
// type.
function scrollIntoView(el: HTMLElement, container: any): void {
  if (container == null) {
    container = window;
  }

  let containerTop;
  let containerHeight;
  if (container === window) {
    containerHeight = window.innerHeight;
    containerTop = window.scrollY;
  } else {
    containerHeight = container.getBoundingClientRect().height;
    containerTop = container.scrollTop;
  }

  const bbox = el.getBoundingClientRect();
  container.scrollTo(window.scrollX, bbox.top + containerTop - (containerHeight - bbox.height) / 2);
}

/**
 * Simple DOM visitor
 *
 * Given a starting node, visits every node while invoking a callback that is expected to produce a
 * boolean value.  Ends when there are no more nodes to visit or the callback returns true.  Note
 * that a truthy value will not terminate visitation; only an explicit `true` value will.
 *
 * @param {Node} node - Node to begin visiting
 * @param {ForEachNodeCallback} callback - Callback to invoke for each node
 *
 * @returns {boolean} Result of last callback call
 */
function visitDOM(node: Node, callback: ForEachNodeCallback): boolean {
  try {
    if (callback(node) === true) {
      return true;
    }
  } catch (x) {
    console.error('exception raised while executing visitor callback:', x);
  }

  if (node.nodeType === Node.TEXT_NODE) {
    return false;
  }

  for (const child of node.childNodes) {
    if (visitDOM(child, callback)) {
      return true;
    }
  }

  return false;
}

/**
 * Find last text node in given DOM sub-tree
 *
 * @param {HTMLElement} container - container element on whose tree to perform search
 * @returns {Node | null} Last text node found or `null` if none
 */
function findLastTextNode(container: HTMLElement): Node | null {
  let lastTextNode = null;

  visitDOM(container, node => {
    if (node.nodeType === Node.TEXT_NODE) {
      lastTextNode = node;
    }

    return false;
  });

  return lastTextNode;
}

// Export "private" functions so they too can be tested.
export { classNameToSet, ensureIterable };

export {
  addClass,
  removeClass,
  getHighlightElements,
  getForQuerySet,
  getAllHighlightElements,
  isHighlightVisible,
  createHighlightElement,
  insertBefore,
  insertAfter,
  getOffset,
  isInView,
  scrollIntoView,
  visitDOM,
  findLastTextNode,
};
