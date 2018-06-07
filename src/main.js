// @flow

// For whatever reason, it is not possible to use the handy `export * from "module"` syntax.
import HtmlHighlighter from './htmlhighlighter';
import RangeHighlighter from './rangehighlighter';
import TextFinder from './textfinder';
import XPathFinder from './xpathfinder';
import type { ClientOptions } from './typedefs';

export type { ClientOptions };
export { HtmlHighlighter, RangeHighlighter, TextFinder, XPathFinder };
