// @flow

import type { TextSubject, XpathSubject } from './typedefs';
import TextContent from './textcontent';
import Finder from './finder';
import TextFinder from './textfinder';
import XpathFinder from './xpathfinder';

/**
 * Construct appropriate `Finder`-derived class for a given subject
 *
 * @param {TextContent} content - reference to `TextContent` holding a text representation of the
 * document
 * @param {TextSubject | XpathSubject} subject - subject to find; can be of `string` or `RegExp`
 * type
 *
 * @returns {Finder} finder instance ready for use
 */
function finder(content: TextContent, subject: TextSubject | XpathSubject): Finder {
  // FIXME: employ more robust check below that doesn't assume Xpath finder by default
  return TextFinder.isSubject(subject)
    ? new TextFinder(content, (subject: any))
    : new XpathFinder(content, (subject: any));
}

export { finder };
