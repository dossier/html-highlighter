/* global $ */

export function is$(el) {
  return el instanceof $;
}

export function isFn(r) {
  return typeof r === 'function';
}

export function isObj(r) {
  return r !== null && typeof r === 'object';
}

export function isStr(r) {
  return typeof r === 'string' || r instanceof String;
}

export function likeObj(r) {
  return r instanceof Object;
}

export function isObjEmpty(x) {
  if (!likeObj(x)) {
    throw new Error('Reference not provided or not an object');
  }

  return Object.keys(x).length === 0;
}
