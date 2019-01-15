// @flow

import 'babel-polyfill';

// For whatever reason, it is not possible to use the handy `export * from "module"` syntax.
import { setVerbose, getVerbose, setDebugging, getDebugging } from './globals';
import HtmlHighlighter from './htmlhighlighter';
import RangeHighlighter from './rangehighlighter';
import TextFinder from './textfinder';
import XPathFinder from './xpathfinder';
import type { ClientOptions, TextSubject, XpathSubject } from './typedefs';

export type { ClientOptions, TextSubject, XpathSubject };
export {
  HtmlHighlighter,
  RangeHighlighter,
  TextFinder,
  XPathFinder,
  setVerbose,
  getVerbose,
  setDebugging,
  getDebugging,
};
