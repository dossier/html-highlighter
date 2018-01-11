// FIXME: drop camel case use
/* eslint-disable camelcase */

import $ from 'jquery';

import TextFinder from './textfinder';
import XpathFinder from './xpathfinder';

export function abstract() {
  throw new Error('Abstract method not implemented');
}

export function is_$(el) {
  return el instanceof $;
}
export function isfn(r) {
  return typeof r === 'function';
}
export function is_obj(r) {
  return r !== null && typeof r === 'object';
}
export function is_str(r) {
  return typeof r === 'string' || r instanceof String;
}

export function like_obj(r) {
  return r instanceof Object;
}

export function is_obj_empty(x) {
  if (!like_obj(x)) {
    throw new Error('Reference not provided or not an object');
  }

  return Object.keys(x).length === 0;
}

/**
 * Construct appropriate `Finder`-derived class for a given subject
 *
 * @param {TextContent} content - reference to `TextContent` holding a text representation of the
 * document
 * @param {*} subject - subject to find; can be of any type
 *
 * @returns {Finder} finder instance ready for use
 */
export function constructFinder(content, subject) {
  return is_str(subject) || subject instanceof RegExp
    ? new TextFinder(content, subject)
    : new XpathFinder(content, subject);
}
