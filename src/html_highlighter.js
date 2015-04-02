/**
 * @file HTML Highlighter module.
 * @copyright 2015 Diffeo
 *
 * Comments:
 *
 */


(function (factory, window) {

  if(typeof window.define === "function" && window.define.amd) {
    window.define([ 'jquery', 'SortingCommon' ], function($, std) {
      return factory(window, $, std);
    } );
  }

} )(/** @lends <global> */ function (window, $, std, undefined) {

  /**
   * @class
   * Main class of the HTML Highlighter module, which exposes an API enabling
   * clients to control all the features supported related to highlighting and
   * text selection.
   *
   * @param {Object} options - Map containing options
   * */
  var Main = function (options)
  {
    /* Assign defaults. */
    options = $.extend(true, $.extend(true, {}, defaults), options);

    Object.defineProperties(this, {
      ui:      { value: new Ui(this, options) },
      options: { value: options               },
      cursor:  { value: new Cursor(this)      }
    } );

    this.queries = { };
    this.stats = {
      queries: 0,
      total: 0,
      highlight: 0
    };

    /* Start by refreshing the internal document's text representation. */
    this.refresh();
    console.info('HTML highlighter instantiated');
  };

  /**
   * Refreshes the internal representation of the text.  Should only be invoked
   * when the HTML structure mutates.
   */
  Main.prototype.refresh = function ()
  {
    this.content = new TextContent(this.options.container.get(0));

    /* TODO: remove */
    this.content.assert();
  };

  /**
   * Create a query set by the name and containing one or more queries.  If the
   * query set already exists, its contents and highlights are first destroyed
   * and new one created.
   *
   * Note that, at this point in time, only string queries are supported.
   *
   * @param {string} name - Name of the query set.
   * @param {string[]} queries - Array containing individual queries to
   * highlight. */
  Main.prototype.add = function (name, queries)
  {
    if(!std.is_arr(queries))
      throw 'Invalid or no queries array specified';

    var q, self = this,
        highlighter = new RangeHighlighter(this.stats.highlight);

    /* Remove query set if it exists. */
    if(name in this.queries)
      this.remove(name);

    q = this.queries[name] = {
      enabled: true,
      set: [ ]
    };

    /* TODO: There is currently no need to save every single highlight id in
     * the `sets´ array since, if I understand it correctly, individual query
     * set highlights will never be removed.  If they're never removed, then
     * one can assume that highlight ids within a particular query set are
     * contiguous, with the only attribute needed to be saved being the *start*
     * highlight id; the end highlight id can be computed by adding set length
     * minus 1 to start id.
     * --------------------------------------------------------------------- */
    /* For each query, perform a lookup in the internal text representation
     * and highlight each hit.  The global id of each highlight is recorded in
     * the `this.queries[name].set´ array. */
    queries.forEach(function (i) {
      var hit, finder = Finder.construct(self.content, i);
      while((hit = finder.next(i)) !== false)
        q.set.push(highlighter.do(hit));
    } );


    /* Update global statistics. */
    ++this.stats.queries;
    this.stats.total += q.set.length;

    /* Ensure CSS highlight class rolls over on overflow. */
    ++this.stats.highlight;
    if(this.stats.highlight >= this.options.maxHighlight)
      this.stats.highlight = 0;

    /* Set cursor on the first query of the first query set and update the UI
     * state. */
    this.cursor.clear(false);
    this.ui.update();
  };

  /**
   * Remove a query set by name.
   *
   * An exception is thrown if the query set does not exist.
   *
   * @param {string} name - Name of the query set to remove. */
  Main.prototype.remove = function (name)
  {
    this.remove_(name);

    this.cursor.clear(false);
    this.ui.update();
  };

  /**
   * Enable a query set.
   *
   * An exception is thrown if the query set does not exist.  If the query set
   * is currently already enabled, nothing is done.
   *
   * @param {string} name - Name of the query set to enable. */
  Main.prototype.enable = function (name)
  {
    var q = this.queries[name];

    if(q === undefined)
      throw 'Query set non-existent';
    else if(q.enabled)
      return;

    q.set.forEach(function (i) {
      $('.' + Css.highlight + '-id-' + i).removeClass(Css.disabled);
    } );

    q.enabled = true;
    this.stats.total += q.set.length;
    this.cursor.clear();
  };

  /**
   * Disable a query set.
   *
   * An exception is thrown if the query set does not exist.  If the query set
   * is currently already disabled, nothing is done.
   *
   * @parm {string} name - Name of the query set to disable. */
  Main.prototype.disable = function (name)
  {
    var q = this.queries[name];

    if(q === undefined)
      throw 'Query set non-existent';
    else if(!q.enabled)
      return;

    q.set.forEach(function (i) {
      $('.' + Css.highlight + '-id-' + i).addClass(Css.disabled);
    } );

    q.enabled = false;
    this.stats.total -= q.set.length;
    this.cursor.clear();
  };

  /**
   * Remove <strong>all</strong> query sets.
   * */
  Main.prototype.clear = function ()
  {
    for(var k in this.queries)
      this.remove_(k);

    if(!std.is_obj_empty(this.queries))
      throw "Query set object not empty";

    this.cursor.clear(false);
    this.ui.update();
  };

  /**
   * Convenience method to clear the current cursor state.  The cursor is set
   * to the first query if queries exist, otherwise it is set to an invalid
   * state. */
  Main.prototype.clearCursor = function ()
  {
    this.cursor.clear();
  };

  /**
   * Move cursor position to the next query in the active query set.  If the
   * cursor moves past the last query in the active query set, the active query
   * set moves to the next available one and the cursor position to its first
   * query.  If the current query set is the last in the collection and thus it
   * is not possible to move to the next query set, the first query set is made
   * active instead, thus ensuring that the cursor always rolls over. */
  Main.prototype.next = function ()
  {
    /* Do not worry about overflow; just increment it. */
    this.cursor.set(this.cursor.index + 1);
  };

  /**
   * Move cursor position to the previous query in the active query set.  If
   * the cursor moves past the first query in the active query set, the active
   * query set moves to the previous available one and the cursor position to
   * its last query.  If the current query set is the first in the collection
   * and thus it is not possible to move to the previous query set, the last
   * query set is made active instead, thus ensuring that the cursor always
   * rolls over. */
  Main.prototype.prev = function ()
  {
    this.cursor.set((this.cursor.index === 0
                     ? this.stats.total
                     : this.cursor.index) - 1);
  };

  /**
   * Return the current selected text range in the form of a <code>Range</code>
   * object.  If there is no selected text, <code>null</code> is returned.
   *
   * @returns {Range|null} The current selected text range or <code>null</code>
   * if it could not be computed. */
  Main.prototype.getSelectedRange = function ()
  {
    var sel = window.getSelection(), len;

    /* Note: assigning `len´ in conditional below so as to simplify code;
     * would require additional lines of code otherwise. */
    if(!(sel && sel.anchorNode && (len = sel.toString().length) > 0))
      return null;
    else if(sel.anchorNode.nodeType !== 3 || sel.focusNode.nodeType !== 3) {
      console.info('Selection anchor or focus node(s) not text: ignoring');
      return null;
    }

    /* Determine start and end indices in text offset markers array. */
    var start = this.content.find(sel.anchorNode),
        end = (sel.focusNode === sel.anchorNode
               ? start : this.content.find(sel.focusNode));

    if(start < 0 || end < 0) {
      console.error('Unable to retrieve offset of selection anchor or focus'
                    + 'node(s)', sel.anchorNode, sel.focusNode);
      return null;
    }

    /* Create start and end range descriptors, whilst accounting for inverse
     * selection where the user selects text in a right to left orientation. */
    if(start < end || (start === end && sel.anchorOffset < sel.focusOffset)) {
      start = Range.descriptorRel(this.content.at(start), sel.anchorOffset);

      if(sel.focusNode === sel.anchorNode) {
        end = $.extend(true, { }, start);
        end.offset = start.offset + len - 1;
      } else
        end = Range.descriptorRel(this.content.at(end), sel.focusOffset - 1);
    } else {
      var mi = start;
      start = Range.descriptorRel(this.content.at(end), sel.focusOffset);

      if(sel.focusNode === sel.anchorNode) {
        end = $.extend(true, { }, start);
        end.offset = end.offset + len - 1;
      } else
        end = Range.descriptorRel(this.content.at(mi), sel.anchorOffset - 1);
    }

    return new Range(this.content, start, end);
  };

  Main.prototype.clearSelectedRange = function ()
  {
    /* From: http://stackoverflow.com/a/3169849/3001914
     * Note that we don't support IE at all. */
    if (window.getSelection) {
      if (window.getSelection().empty)                    /* Chrome */
        window.getSelection().empty();
      else if (window.getSelection().removeAllRanges)     /* Firefox */
        window.getSelection().removeAllRanges();
    }
  };

  /**
   * Return boolean indicative of whether one or more query sets are currently
   * contained.
   *
   * @returns {boolean} <code>false</code> if no query sets currently
   * contained; <code>true</code> otherwise. */
  Main.prototype.empty = function ()
  {
    for(var k in this.queries) {
      if(this.queries[k].set.length > 0)
        return false;
    }

    return true;
  };

  /* Private interface
   * ----------------- */
  /**
   * Remove a query set by name.
   *
   * Throws an exception if the query set does not exist.
   * @access private
   *
   * @param {string} name - The name of the query set to remove. */
  Main.prototype.remove_ = function (name)
  {
    var q = this.queries[name];

    if(q === undefined)
      throw 'Query set non-existent';

    var highlighter = new RangeHighlighter(0);

    --this.stats.queries;
    this.stats.total -= q.set.length;

    q.set.forEach(function (i) {
      highlighter.undo(i);
    } );

    delete this.queries[name];
  };


  /**
   * @class
   * Class responsible for managing the state of the highlight cursor.
   *
   * @param {Object} owner - Reference to the owning instance.
   * */
  var Cursor = function (owner)
  {
    std.Owned.call(this, owner);

    this.query = null;
    this.index = -1;
  };

  /**
   * Clear the current cursor state.
   *
   * @param {boolean} [update=true] - Boolean flag that, when
   * <strong>not</strong> <code>false</code>, results in the UI state being
   * updated. */
  Cursor.prototype.clear = function (update /* = true */)
  {
    this.clear_();

    if(update !== false)
      this.owner.ui.update(false);
  };

  /**
   * Set cursor to query referenced by absolute query index.  The absolute
   * query index is computed by adding the lengths of each preceding query set
   * and the relative index of a given query set, as illustrated by:
   *
   * <pre>
   * queries = first:  { set: [ 1, 2, 3 ] },
   *           second: { set: [ 4, 5, 6, 7 ] },
   *           third:  { set: [ 8, 9, 10, 11, 12 ] };</pre>
   *
   * Using the example above, an absolute query index of 11 would reference
   * element <code>12</code> because <code>first.set.length + second.set.length
   * = 7</code>, and since <code>7 + 5</code> (<code>5</code> being the number
   * of elements in <code>third.set</code>) would be > than <code>11</code>,
   * then <code>11</code> must reference the relative index in
   * <code>third</code> given by <code>11 - 7</code>, or <code>4</code>. */
  Cursor.prototype.set = function (index)
  {
    var query = null,
        offset = 0,
        queries = this.owner.queries;

    if(index < 0)
      throw 'Invalid cursor index specified';
    else if(this.owner.empty())
      return;

    /* Find query set that corresponds to specified global index. */
    for(var k in queries) {
      var l, q = queries[k];

      if(!q.enabled)
        continue;

      l = q.set.length;

      if(index >= offset && index < offset + l) {
        query = q;
        break;
      }

      offset += l;
    }

    /* `index´ past maximum offset? Back to top, if so. */
    if(query === null) {
      /* Re-compute to account for disabled query sets. */
      this.set(0);
      return;
    }

    this.clearActive_();
    var el = $('.' + Css.highlight + '-id-' + query.set[index - offset])
      .addClass(Css.enabled)
      .eq(0);

    /* Scroll viewport if element not visible. */
    if(!std.$.inview(el))
      std.$.scrollIntoView(el);

    this.query = query;
    this.index = index;

    this.owner.ui.update(false);
  };

  /* Private interface
   * ----------------- */
  /**
   * Clear the active cursor by making it inactive if no query sets exist, or
   * moving the cursor to the first query of the first query set.
   * @access private
   * */
  Cursor.prototype.clear_ = function ()
  {
    this.clearActive_();

    if(this.owner.empty()) {
      this.query = null;
      this.index = -1;
    } else
      this.set(0);
  };

  /**
   * Clear the currently active cursor highlight.  The active cursor highlight
   * is the element or elements at the current cursor position.
   * @access private
   * */
  Cursor.prototype.clearActive_ = function ()
  {
    $('.' + Css.highlight + '.' + Css.enabled).removeClass(Css.enabled);
  };


  /**
   * @class
   * Class responsible for building and keeping a convenient representation of
   * the text present in an HTML DOM sub-tree.
   *
   * @param {DOMElement|jQuery} root - Reference to a DOM element or jQuery
   * instance.  If a jQuery instance is given, its first element is used.
   * */
  var TextContent = function (root)
  {
    Object.defineProperty(this,
      'root', { value:  std.$.is(root) ? root.get(0) : root } );

    this.offset = 0;
    this.markers = [ ];

    this.refresh();
  };

  /**
   * Refreshes the internal representation of the text.  Should only be invoked
   * when the HTML structure mutates. */
  TextContent.prototype.refresh = function ()
  {
    this.text = '';
    this.visit_(this.root);
  };

  /**
   * Debug method for asserting that the current textual representation if
   * valid, in particular that the offset markers are all contiguous. */
  TextContent.prototype.assert = function ()
  {
    var offset = 0;

    /* Ensure offsets are contiguous. */
    for(var i = 0, l = this.markers.length; i < l; ++i) {
      var marker = this.markers[i];

      if(marker.offset !== offset) {
        console.error("Invalid offset: %d@ %d:%d ->",
                      i, marker.offset, offset, marker);
        throw "Invalid offset";
      }

      offset += marker.node.nodeValue.length;
    }
  };

  /**
   * <p>Truncate a text node given by <code>marker</code> by turning it into 2
   * or 3 text nodes, with one of them used for highlighting purposes.</p>
   *
   * <p>If <code>start == end</code>, no truncation takes place
   * <strong>but</strong> the old text node is replaced by a new one.  If
   * <code>start == 0</code>, two text nodes are created.  If <code>start >
   * 0</code>, three text nodes are produced.</p>
   *
   * <p>The text node used for highlighting purposes is always the one
   * referenced by the offsets <code>[start .. end]</code>.
   *
   * @param {Object} marker - Reference to descriptor of text node to
   * truncate.
   * @param {number} start - Offset where to start truncation.
   * @param {number} end - Offset where truncation ends. */
  TextContent.prototype.truncate = function (marker, start, end)
  {
    var index = this.indexOf(marker.offset),
        text = marker.node.nodeValue,
        old = marker.node;      /* The old text node. */

    /* Sanity checks */
    if(start < 0 || end < 0 || end >= text.length)
      throw "Invalid truncation parameters";

    /* Chars 0..start - 1 */
    if(start > 0) {
      /* Since we're creating a new text node out of the old text node, we need
       * to add a new entry to the markers array. */
      this.markers.splice(index, 0, {
        offset: marker.offset,
        node: $(document.createTextNode(text.substr(0, start)))
          .insertBefore(marker.node).get(0)
      });

      ++index;
    }

    /* Chars start..end
     * ----------------
     * We don't need to add a new entry to the markers array since we're not
     * technically creating a new text node, just replacing it with one with
     * the required [start..end] substring.  We do need to update the node's
     * offset though. */
    marker.offset += start;
    marker.node = $(document.createTextNode(
      text.substr(start, end - start + 1)))
      .insertBefore(marker.node)
      .get(0);

    /* Chars end + 1..length */
    if(end !== text.length - 1) {
      if(index >= this.markers.length)
        throw "Detected invalid index";

      /* We're again creating a new text node out of the old text node and thus
       * need to add a new entry to the markers array. */
      this.markers.splice(index + 1, 0, {
        offset: marker.offset + end - start + 1,
        node: $(document.createTextNode(text.substr(end + 1)))
          .insertAfter(marker.node).get(0)
      } );
    }

    /* TODO: remove me. */
    this.assert();

    /* Remove old node. */
    old.parentNode.removeChild(old);

    return index;
  };

  /**
   * Return the index of the marker descriptor of a given text offset.
   *
   * Note: employs the binary search algorithm.
   *
   * @param {number} offset - The offset to look up.
   * @returns {number} The marker index that contains <code>offset</code>. */
  TextContent.prototype.indexOf = function (offset)
  {
    var mid,
        markers = this.markers,
        min = 0,
        max = markers.length - 1;

    while(min < max) {
      mid = Math.floor((min + max) / 2);

      if(markers[mid].offset < offset)
        min = mid + 1;
      else
        max = mid;
    }

    if(markers[min].offset <= offset)
      return min;
    else if(min === 0)
      throw 'Invalid offset of text content state';

    return min - 1;
  };

  /**
   * Find the index of the marker descriptor of a given text node element.
   *
   * @param {DOMElement} element - Reference to the text node to look up.
   * @param {number} [start=0] - Start index.
   *
   * @returns {number} The marker index of <code>element</code> or
   * <code>-1</code> if not found. */
  TextContent.prototype.find = function (element, start)
  {
    if(element.nodeType !== 3)
      return -1;

    for(var i = start === undefined ? 0 : start,
            l = this.markers.length; i < l; ++i)
    {
      if(this.markers[i].node === element)
        return i;
    }

    return -1;
  };

  /**
   * Return the offset marker descriptor at a given index.  Throws an exception
   * if the given <code>index</code> is out of bounds.
   *
   * @param {number} index - Marker index.
   * @returns {Object} The offset marker descriptor. */
  TextContent.prototype.at = function (index)
  {
    if(index < 0 || index >= this.markers.length)
      throw "Invalid marker index";

    return this.markers[index];
  };

  /**
   * Build representation of the text contained in a HTML DOM sub-tree and the
   * offsets of each text node.
   * @access private
   *
   * @param {DOMElement} node - The node to visit. */
  TextContent.prototype.visit_ = function (node)
  {
    if(node.nodeType === 3) {
      var content = node.nodeValue,
          length = content.length;

      this.markers.push( { node: node, offset: this.offset } );
      this.text += content;
      this.offset += length;

      return;
    }

    var ch = node.childNodes;
    if(ch.length > 0) {
      for(var i = 0, l = ch.length; i < l; ++i)
        this.visit_(ch[i]);
    }
  };


  var Finder = function (content, subject)
  {
    Object.defineProperty(this, 'content', { value: content } );

    this.results = [ ];
    this.current = 0;
  };

  Finder.construct = function (content, subject)
  {
    return std.is_obj(subject)
      ? new XpathFinder(content, subject)
      : new TextFinder(content, subject);
  };

  /**
   * Return next available match.  If no more matches available, returns
   * <code>false</code>.
   * @abstract
   *
   * @returns {Range|false} Returns a <code>Range</code> if a match is
   * available, or <code>false</code> if no more matches are available. */
  Finder.prototype.next = std.absm_noti;

  /* Protected interface
   * ----------------- */
  /**
   * Return a <code>Range</code> descriptor for a given offset.
   * @access private
   *
   * @param {number} offset - Text offset
   * @returns {Object} Range descriptor. */
  Finder.prototype.getAt_ = function (offset)
  {
    var index = this.content.indexOf(offset);
    if(index === -1)
      throw "Failed to retrieve marker for offset: " + offset;

    return Range.descriptorAbs(this.content.at(index), offset);
  };


  /**
   * @class
   * Class responsible for finding text in a <code>TextContent</code>
   * instance.
   *
   * @param {TextContent} content - Reference to <code>TextContent</code>
   * instance.
   * @param {string} subject - Subject string to match. */
  var TextFinder = function (content, subject)
  {
    /* Construct base class. */
    Finder.call(this, content);

    /* Build an array containing all hits of `subject´. */
    var match,
        re = new RegExp(subject.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&"),
                        'gi');

    while((match = re.exec(this.content.text)) !== null)
      this.results.push( { length: match[0].length, index: match.index } );
  };

  TextFinder.prototype = Object.create(Finder.prototype);

  /**
   * Return next available match.  If no more matches available, returns
   * <code>false</code>.
   *
   * @returns {Range|false} Returns a <code>Range</code> if a match is
   * available, or <code>false</code> if no more matches are available. */
  TextFinder.prototype.next = function ()
  {
    if(this.current >= this.results.length)
      return false;

    var end, range,
        match = this.results[this.current],
        length = match.length,
        start = this.getAt_(match.index);

    end = ( length === 1
            ? $.extend({ }, start) /* same as start: duplicate it */
            : this.getAt_(match.index + length - 1) );

    range = new Range(this.content, start, end);

    /* Move onto next search item. */
    ++ this.current;

    return range;
  };


  /**
  {

  };


  /**
   * @class
   * Convenience class for applying or removing highlighting on
   * <code>Range</code> instances.
   *
   * @param {number} count - The CSS highlight class index to use.
   * */
  var RangeHighlighter = function (count)
  {
    var classes = [ Css.highlight,
                    Css.highlight + '-' + count ].join(' ');

    /**
     * Highlight a <code>Range</code> instance.
     *
     * @param {Range} range - Range instance to apply highlighting to.
     * @returns {number} Unique highlight id. */
    this.do = function (range) {
      range.surround(classes + ' ' + Css.highlight + '-id-'
                     + RangeHighlighter.id);

      return RangeHighlighter.id ++;
    };

    /**
     * Remove highlighting given by id.
     *
     * @param {number} id - Id of the highlight to remove. */
    this.undo = function (id) {
      var coll = $('.' + Css.highlight + '-id-' + id);
      coll.each(function () {
        var el = $(this);

        el.contents().insertBefore(el);
        el.remove();
      } );
    };
  };

  /**
   * Last highlight id used. */
  RangeHighlighter.id = 0;


  /**
   * @class
   * Holds a representation of a range between two text nodes.
   *
   * @param {TextContent} content - text representation instance.
   * @param {Object} start - descriptor of start of range.
   * @param {Object} end - descriptor of end of range.
   * */
  var Range = function (content, start, end)
  {
    this.content = content;

    /* Attributes */
    Object.defineProperties(this, {
      start: { value: start },
      end:   { value: end   }
    } );
  };

  /**
   * Create a range descriptor from a global offset relative to the start of
   * the text content.
   *
   * @param {Object} marker - Text offset marker object.
   * @param {number} offset - Global offset.
   *
   * @returns {Object} Range descriptor. */
  Range.descriptorAbs = function (marker, offset)
  {
    var descriptor = { marker: marker };
    descriptor.offset = offset - marker.offset;
    return descriptor;
  };

  /**
   * Create a range descriptor from an offset relative to the start of the text
   * node string.
   *
   * @param {Object} marker - Text offset marker object.
   * @param {number} offset - Relative offset from start of text node string.
   *
   * @returns {Object} Range descriptor. */
  Range.descriptorRel = function (marker, offset)
  {
    var descriptor = { marker: marker };
    descriptor.offset = offset;
    return descriptor;
  };

  /**
   * Highlight a range by wrapping a text node or a portion of it with a
   * <code>span</code> tag and applying a particular CSS class.
   *
   * @param {string} className - The CSS class name to apply.*/
  Range.prototype.surround = function (className)
  {
    /* Optimised case: highlight does not span multiple nodes. */
    if(this.start.marker.node === this.end.marker.node) {
      this.surround_(this.start, this.start.offset,
                     this.end.offset, className);
      return;
    }

    /* Highlighting spans 2 or more nodes, which means we need to build a
     * representation of all the text nodes contained in the start to end
     * range, but excluding the start and end nodes. */
    var self = this,
        visitor = new TextNodeVisitor(this.start.marker.node),
        end = this.end.marker.node,
        coll = [ ];

    while(visitor.next() != end)
      coll.push(visitor.current);

    /* Apply highlighting to start and end nodes, and to any nodes in between,
     * if applicable. */
    this.surround_(this.start, this.start.offset, null, className);
    coll.forEach(function (n) { self.surround_whole_(n, className); } );
    this.surround_(this.end, 0, this.end.offset, className);
  };

  /**
   * Compute the XPath representation of the active range.
   *
   * @param {DOMElement} root - The root element.
   * @returns {string} XPath representation of active range. */
  Range.prototype.computeXpath = function (root)
  {
    return (new TextNodeXpath(root)).xpathOf(this.start.marker.node);
  };

  /* Private interface
   * ----------------- */
  /**
   * Truncate text node into 2 or 3 text nodes and apply highlighting to
   * relevant node, which is always the node referenced by
   * <code>descr.marker.node</code>.
   *
   * @param {Object} descr - Start or end <code>Range</code> descriptor.
   * @param {number} start - Start offset.
   * @param {number} end - End offset.
   * @param {string} className - CSS class name to apply.
   * */
  Range.prototype.surround_ = function (descr, start, end, className)
  {
    this.content.truncate(
      descr.marker, start,
      end === null ? descr.marker.node.nodeValue.length - 1 : end);

    $('<span/>')
      .addClass(className)
      .insertBefore(descr.marker.node)
      .append(descr.marker.node);
  };

  /**
   * Apply highlighting fully to a text node. No text node truncation occurs.
   *
   * @param {DOMElement} node - Text node to apply highlighting to.
   * @param {string} className - CSS class name to apply.
   * */
  Range.prototype.surround_whole_ = function (node, className)
  {
    $('<span/>')
      .addClass(className)
      .insertBefore(node)
      .append(node);
  };


  /**
   * @class
   * This class builds XPath representations of text nodes, optionally within a
   * DOM sub-tree.  If a root node is specified, the XPath produced will
   * include the elements up to but <strong>not</strong> including said root
   * node.
   *
   * @param {DOMElement} [root=null] - Root DOM node. */
  var TextNodeXpath = function (root)
  {
    this.root = root || null;
    if(std.$.is(this.root)) this.root = this.root.get(0);
  };

  /**
   * Compute the XPath representation of an arbitrary node, not necessarily a
   * text node.
   *
   * @param {DOMElement} node - Node to compute XPath representation of.
   * @returns {string} XPath representation. */
  TextNodeXpath.prototype.xpathOf = function (node)
  {
    var id, name,
        xpath = '';

    for(; node !== this.root && node.nodeType === 1 || node.nodeType === 3;
        node = node.parentNode)
    {
      /* Ignore current node if it is a SPAN element and the string given by
       * `Css.highlight´ is found in its `className´ attribute.  In other
       * words, ignore current node if it is the container of a highlight. */
      if(this.isContainer_(node)) continue;

      id = this.indexOf_(node);
      xpath = '/' + node.nodeName.toLowerCase()
        + (id === 1 ? '' : '[' + id + ']')
        + xpath;
    }

    return xpath;
  };

  /**
   * Return boolean value indicative of whether a given node is a highlight
   * container.
   * @access private
   *
   * @param {DOMElement} node - DOM element to check
   * @returns {boolean} <code>true</code> if it is a highlight container. */
  TextNodeXpath.prototype.isContainer_ = function (node)
  {
    /* NOTE: this is potentially problematic if the document uses class names
     * that contain or are equal to `Css.highlight´. */
    return node.nodeName.toLowerCase() === 'span'
      && node.className.indexOf(Css.highlight) !== -1;
  };

  /**
   * <p>Return the XPath index of an arbitrary node relative to its sibling
   * nodes.  Since text nodes are liable to be truncated to enable highlight of
   * a substring of text, this method counts contiguous text nodes and
   * highlight container elements as one, e.g.:</p>
   *
   * <pre>
   * #text + STRONG + #text + SPAN.highlight
   * </pre>
   *
   * <p>In the example above, the index of the third node is the same as the
   * fourth node's, or 3.  More clearly:</p>
   *
   * <pre>
   * 1, 2, 3, 3
   * </pre>
   *
   * <p>Note that XPath indices are <strong>not</strong> zero-based.</p>
   *
   * @access private
   *
   * @param {DOMElement} node - DOM element to calculate index of.
   * @returns {number} Index of node plus one. */
  TextNodeXpath.prototype.indexOf_ = function (node)
  {
    var index = 1,
        wasText = false;

    while( (node = node.previousSibling) !== null) {
      /* Don't count contiguous text nodes or highlight containers as being
       * separate nodes.  IOW, contiguous text nodes or highlight containers
       * are treated as ONE element. */
      if(this.isContainer_(node) || node.nodeType === 3) {
        if(wasText) continue;
        wasText = true;
      } else
        wasText = false;

      ++ index;
    }

    return index;
  };


  /**
   * @class
   * Convenient class for visiting all text nodes that are siblings and
   * descendants of a given root node.
   *
   * Note: this class has some issues.  In particular, no bounds checks are
   * made to ensure that
   *
   * @param {DOMElement} root - The root node.
   * */
  var TextNodeVisitor = function (root)
  {
    /* Attributes */
    var current = root;

    /* Getters */
    Object.defineProperty(
      this, 'current', { get: function () { return current; } });


    /**
     * Get the next text node.
     *
     * @returns {DOMElement} The next text node or <code>null</code> if none
     * found. */
    this.next = function ()
    {
      if(current.nodeType !== 3)
        throw "Invalid node type: not text";

      return (current = nextText_(nextNode_(current)));
    };

    /* Private interface
     * ----------------- */
    /**
     * Get the next node, text or otherwise, that is either a sibling or
     * parent to a given node.
     *
     * @param {DOMElement} node current node.
     * @returns {DOMElement} next node or <code>null</code> if none
     * available. */
    function nextNode_ (node)
    {
      if(node === null)
        return null;
      else if(node.nextSibling !== null)
        return node.nextSibling;

      return nextNode_(node.parentNode);
    }

    /**
     * Get the next available text node, that is either a descendant, sibling
     * or otherwise, of a given node.
     *
     * @param {DOMElement} node current node.
     * @returns {DOMElement} next node or <code>null</code> if none
     * available. */
    function nextText_(node)
    {
      if(node === null || node.nodeType === 3)
        return node;

      var ch = node.childNodes;
      if(ch.length > 0)
        return nextText_(ch[0]);

      return nextText_(nextNode_(node));
    }
  };


  /**
   * @class
   * */
  var Ui = function (owner, options)
  {
    std.Owned.call(this, owner);

    if(!std.$.is(options.widget)) {
      console.warn('HTML highlighter UI unavailable');
      Object.defineProperty(this, 'options', { value: false } );
      return;
    }

    Object.defineProperty(this, 'options', { value: options } );

    var self = this,
        finder = new std.NodeFinder('data-hh-scope', '', options.widget);

    this.root = finder.root;
    this.nodes = {
      statsCurrent: finder.find('stats-current'),
      statsTotal: finder.find('stats-total'),
      next: finder.find('button-next'),
      prev: finder.find('button-prev'),
      expander: finder.find('expand'),
      entities: finder.find('entities')
    };

    finder = new std.TemplateFinder('text/hh-template', 'data-hh-scope');
    this.templates = {
      entityRow: finder.find('entity-row'),
      entityEmpty: finder.find('entity-empty')
    };

    this.timeouts = { };

    this.nodes.expander.click(function () {
      var el = self.nodes.entities;

      el.toggleClass(Css.enabled);

      if('entities' in self.timeouts) {
        window.clearTimeout(self.timeouts.entities);
        self.timeouts.entities = null;
      }

      if(el.hasClass(Css.enabled)) {
        self.timeouts.entities = window.setTimeout(function () {
          el.css('overflow-y', 'auto');
          self.timeouts.entities = null;
        }, self.options.delays.toggleEntities);

        self.nodes.expander.addClass(Css.enabled);
      } else {
        el.css('overflow-y', 'hidden');
        self.nodes.expander.removeClass(Css.enabled);
      }
    } );

    this.nodes.entities.click(function (ev) {
      var node = $(ev.target);
      if(node.data('hh-scope') === 'remove')
        self.owner.remove(self.getName_(node));
    } );

    this.nodes.next.click(function () { self.owner.next(); } );
    this.nodes.prev.click(function () { self.owner.prev(); } );

    /* Initial empty state. */
    this.setEmpty_();

    console.info('HTML highlighter UI instantiated');
  };

  Ui.prototype = Object.create(std.Owned.prototype);

  Ui.prototype.update = function (full)
  {
    if(!this.options) return false;

    this.nodes.statsCurrent.html(
      this.owner.cursor.index >= 0
        ? this.owner.cursor.index + 1
        : '-');

    this.nodes.statsTotal.html(this.owner.stats.total);

    if(full === false || this.templates.entityRow === null)
      return;
    else if(std.is_obj_empty(this.owner.queries)) {
      this.setEmpty_();
      return;
    }

    /* Template `entity-row´ must supply an LI element skeleton. */
    var self = this,
        elu = $('<ul/>');

    for(var k in this.owner.queries) {
      var q = this.owner.queries[k],
          eli = this.templates.entityRow.clone();

      if(q.enabled)
        eli.find('enable').prop('checked', true);

      eli.find('name').text(k);
      eli.find('count').text(q.set.length);
      elu.append(eli.get());
    }

    elu.click(function (ev) {
      var node = $(ev.target);
      if(node.data('hh-scope') === 'enable') {
        if(node.prop('checked'))
          self.owner.enable(self.getName_(node));
        else
          self.owner.disable(self.getName_(node));
      }
    } );

    this.nodes.entities.children().remove();
    this.nodes.entities.append(elu);
  };

  Ui.prototype.getName_ = function (node)
  {
    return node.parentsUntil('ul').last()
      .find('[data-hh-scope="name"]').text();
  };

  Ui.prototype.setEmpty_ = function ()
  {
    this.nodes.entities.children().remove();

    if(this.templates.entityEmpty !== null)
      this.nodes.entities.append($(this.templates.entityEmpty.innerHTML));
  };


  var Css = {
    highlight: 'hh-highlight',
    enabled: 'hh-enabled',
    disabled: 'hh-disabled'
  };

  var defaults = {
    maxHighlight: 1,
    delays: {
      toggleEntities: 250
    }
  };


  /* API export */
  return {
    HtmlHighlighter: Main,
    HtmlHighlighterUi: Ui,
    HtmlRangeHighlighter: RangeHighlighter
  };

}, this);