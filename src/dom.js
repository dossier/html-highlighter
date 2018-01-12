// @flow

import { Css } from './consts';

export type Position = {| x: number, y: number |};

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
  const boundingBox = el.getBoundingClientRect();
  const docTop = window.scrollY;
  const docBottom = docTop + window.innerHeight;
  const top = getOffset(el).y;
  const bottom = top + boundingBox.height;

  return top >= docTop && bottom <= docBottom;
}

// Note that flow does not expose a formal Window type, which means we are unable to validate the
// type.
function scrollIntoView(el: HTMLElement, container: any): void {
  if (container == null) {
    container = window;
  }

  const MARGIN_VERTICAL = 25;

  let containerTop;
  let containerHeight;
  if (container === window) {
    containerHeight = window.innerHeight;
    containerTop = container.scrollY;
  } else {
    containerHeight = container.getBoundingClientRect().height;
    containerTop = container.scrollTop;
  }

  const containerBottom = containerTop + containerHeight;
  const elemBoundingBox = el.getBoundingClientRect();
  const elemMarginBottom = parseInt(getComputedStyle(el).getPropertyValue('margin-top'), 10);
  const elemTop = elemBoundingBox.top + elemMarginBottom;
  const elemBottom = elemTop + elemBoundingBox.height + MARGIN_VERTICAL;

  if (elemTop < containerTop) {
    container.scrollTo({ top: elemTop });
  } else if (elemBottom > containerBottom) {
    container.scrollTo({ top: elemBottom - containerHeight });
  }
}

export {
  addClass,
  removeClass,
  getHighlightElements,
  getForQuerySet,
  getAllHighlightElements,
  createHighlightElement,
  insertBefore,
  insertAfter,
  getOffset,
  isInView,
  scrollIntoView,
};
