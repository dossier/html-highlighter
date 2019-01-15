// @flow

import merge from 'merge';

import logger from './logger';
import * as selection from './selection';
import HtmlHighlighter from './htmlhighlighter';
import TextContent from './textcontent';
import TextRange from './textrange';

/**
 * Support for browser text selections
 *
 * This class is an extension of HTML Highlighter which provides support for browser text
 * selections.
 */
class SelectedRange {
  content: TextContent;

  static fromHtmlHighlighter(instance: HtmlHighlighter): SelectedRange {
    return new SelectedRange(instance.content);
  }

  constructor(content: TextContent) {
    this.content = content;
  }

  /* eslint-disable complexity, max-statements */
  /**
   * Return the current selected text range in the form of a `TextRange` object
   *
   * If there is no selected text, `null` is returned.
   *
   * @returns {TextRange|null} The current selected text range or `null` if it could not be
   * computed.
   */
  get(): TextRange | null {
    const sel = window.getSelection();
    if (sel == null) {
      return null;
    }

    const range = sel.getRangeAt(0);
    if (range == null) {
      return null;
    }

    let start, end;
    try {
      start = selection.getNormalizedStartBoundaryPoint(range);
      end = selection.getNormalizedEndBoundaryPoint(range);
    } catch (x) {
      logger.error('unable to compute boundary points:', x);
      return null;
    }

    if (start.node.nodeType !== Node.TEXT_NODE || end.node.nodeType !== Node.TEXT_NODE) {
      logger.info('selection anchor or focus node(s) not text: ignoring');
      return null;
    }

    // Account for selections where the start and end elements are the same *and* whitespace exists
    // longer than one character.  For instance, The element `<p>a   b</p>` is shown as `a b` by
    // browsers with the whitespace rendered collapsed.  This means that in this particular
    // case, it is not possible to simply retrieve the length of the selection's text and use that
    // as the selection's end offset as it would be invalid.  The way to avoid calculating an
    // invalid end offset is by looking at the anchor and focus (start and end) offsets.
    // Strangely, if the selection spans more than one element, one may simply use the length of
    // the selected text regardless of the occurrence of whitespace in between.
    const len =
      start.node === end.node ? Math.abs(end.offset - start.offset) : sel.toString().length;
    if (len <= 0) {
      return null;
    }

    // Determine start and end indices in text offset markers array
    const startOffset = this.content.find(start.node);
    const endOffset = start.node === end.node ? startOffset : this.content.find(end.node);
    if (startOffset < 0 || endOffset < 0) {
      logger.error(
        'unable to retrieve offset of selection anchor or focus node(s):',
        sel.anchorNode,
        start.node,
        sel.focusNode,
        end.node
      );
      return null;
    }

    // Create start and end range descriptors, whilst accounting for inverse selection where the
    // user selects text in a right to left orientation.
    let startDescr, endDescr;
    if (startOffset < endOffset || (startOffset === endOffset && start.offset < end.offset)) {
      startDescr = TextRange.descriptorRel(this.content.at(startOffset), start.offset);

      if (start.node === end.node) {
        endDescr = merge({}, startDescr);
        endDescr.offset += len - 1;
      } else {
        endDescr = TextRange.descriptorRel(this.content.at(endOffset), end.offset - 1);
      }
    } else {
      startDescr = TextRange.descriptorRel(this.content.at(endOffset), end.offset);

      if (end.node === start.node) {
        endDescr = merge({}, startDescr);
        endDescr.offset += len - 1;
      } else {
        endDescr = TextRange.descriptorRel(this.content.at(startOffset), start.offset - 1);
      }
    }

    return new TextRange(this.content, startDescr, endDescr);
  }
  /* eslint-enable complexity, max-statements */

  /**
   * Clear the current text selection
   *
   * Only the Chrome and Firefox implementations are supported.
   */
  clear(): void {
    // From: http://stackoverflow.com/a/3169849/3001914
    // Note that we don't support IE at all.
    const getSelection = window.getSelection;
    if (getSelection != null) {
      if (getSelection().empty) {
        // Chrome
        getSelection().empty();
        return;
      } else if (getSelection().removeAllRanges) {
        // Firefox
        getSelection().removeAllRanges();
        return;
      }
    }

    logger.warn('clearing of text selection not supported');
  }
}

export default SelectedRange;
