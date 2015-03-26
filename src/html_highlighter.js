/**
 * @file HTML Highlighter module.
 * @copyright 2014 Differ
 *
 * Comments:
 *
 */


/**
 * @class
 * */
(function (factory, window) {

  if(typeof window.define === "function" && window.define.amd) {
    window.define([ 'jquery', 'SortingCommon' ], function($, std) {
      return factory(window, $, std);
    } );
  }

} )(function (window, $, std, undefined) {

  /**
   * @class
   * */
  var Main = function (options)
  {
    if(std === undefined)
      throw "Sorting Common not defined";

    Object.defineProperty(this, 'ui', { value: new Ui(this, options) } );
    Object.defineProperty(this, 'options', { value: options } );

    this.queries = { };
    this.stats = {
      queries: 0,
      current: 0,
      total: 0
    };

    this.content = new TextContent(this.options.container.get(0));
    /* TODO: remove */
    this.content.assert();

    console.info('HTML highlighter instantiated');
  };

  Main.prototype.add = function (name, queries)
  {
    if(!std.is_arr(queries))
      throw 'Invalid or no queries array specified';

    var self = this,
        highlighter = new RangeHighlighter(this.stats.queries + 1),
        q;

    if(name in this.queries)
      this.remove(name);

    q = this.queries[name] = {
      enabled: true,
      current: 0,
      set: [ ]
    };

    ++this.stats.queries;

    queries.forEach(function (i) {
      var hit,
          finder = new TextFinder(self.content, i);

      while((hit = finder.next(i)) !== false)
        q.set.push(highlighter.do(hit));
    } );

    this.stats.total += q.set.length;
    this.ui.update();
  };

  Main.prototype.remove = function (name)
  {
    var q = this.queries[name],
        highlighter = new RangeHighlighter(0);

    if(q === undefined)
      throw 'Query set non-existent';

    this.stats.total -= q.total;

    /* TODO: must recalculate current query (`this.stats.current´). */
    q.set.forEach(function (i) {
      highlighter.undo(i);
    } );

    return delete this.queries[name];
  };

  Main.prototype.enable = function (name)
  {
  };

  Main.prototype.disable = function (name)
  {
  };

  Main.prototype.clear = function ()
  {
  };

  Main.prototype.next = function ()
  {
  };

  Main.prototype.prev = function ()
  {
  };

  Main.prototype.getSelectedRange = function ()
  {
  };


  /**
   * @class
   * */
  var TextContent = function (root)
  {
    this.root = std.$.is(root) ? root.get(0) : root;
    this.offset = 0;
    this.markers = [ ];

    this.refresh();
  };

  TextContent.prototype.refresh = function ()
  {
    this.text = '';
    this.visit_(this.root);
  };

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

  TextContent.prototype.truncate = function (marker, start, end)
  {
    var index = this.indexOf(marker.offset),
        text = marker.node.nodeValue,
        old = marker.node;

    /* Sanity checks */
    if(start < 0 || end < 0 || end >= text.length)
      throw "Invalid truncation parameters";

    /* Chars 0..start - 1 */
    if(start > 0) {
      this.markers.splice(index, 0, {
        offset: marker.offset,
        node: $(document.createTextNode(text.substr(0, start)))
          .insertBefore(marker.node).get(0)
      });

      ++index;
    }

    /* Chars start..end */
    marker.offset += start;
    marker.node = $(document.createTextNode(
      text.substr(start, end - start + 1)))
      .insertBefore(marker.node)
      .get(0);

    /* Chars end + 1..length */
    if(end !== text.length - 1) {
      var descr = { offset: marker.offset + end - start + 1,
                    node: $(document.createTextNode(text.substr(end + 1)))
                    .insertAfter(marker.node).get(0)
                  };

      if(index >= this.markers.length)
        throw "Detected invalid index";

      this.markers.splice(index + 1, 0, descr);
    }

    /* TODO: remove me. */
    this.assert();

    /* Remove old node. */
    old.parentNode.removeChild(old);

    return index;
  };

  /* TODO: employ binary search algorithm. */
  TextContent.prototype.indexOf = function (offset)
  {
    var length = this.markers.length;

    if(length <= 0)
      return -1;

    for(var i = 0; i < length; ++i) {
      if(this.markers[i].offset > offset) {
        if(i === 0) throw "Invalid state: wrong offset";
        return i - 1;
      }
    }

    return length - 1;
  };

  TextContent.prototype.find = function (element)
  {
    if(element.nodeType !== 3)
      return null;

    for(var i = 0, l = this.markers.length; i < l; ++i) {
      if(this.markers[i].node === element)
        return i;
    }

    return null;
  };

  TextContent.prototype.at = function (index)
  {
    if(index < 0 || index >= this.markers.length)
      throw "Invalid marker index";

    return this.markers[index];
  };

  TextContent.prototype.visit_ = function (node)
  {
    if(node.nodeType === 3) {
      /* Text matching is only performed on text nodes. */
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


  /**
   * @class
   * */
  var TextFinder = function (content, subject)
  {
    this.content = content;
    this.results = [ ];
    this.current = 0;

    /* TODO: allow regex searches. */
    var match,
        re = new RegExp(subject, 'gi');

    while((match = re.exec(this.content.text)) !== null)
      this.results.push( { length: match[0].length, index: match.index } );
  };

  TextFinder.prototype.next = function ()
  {
    if(this.current >= this.results.length)
      return false;

    var end, range,
        match = this.results[this.current],
        length = match.length,
        start = this.getAt_(match.index);

    end = ( length === 1
            ? $.extend({ }, start) /* same as start: duplicate range */
            : this.getAt_(match.index + length - 1) );

    /* Ignore invalid ranges. */
    try {
      range = new Range(this.content, start, end);
    } catch(x) {
      range = null;
    }

    /* Move onto next search item. */
    ++ this.current;

    return range;
  };

  /* Private interface */
  TextFinder.prototype.getAt_ = function (offset)
  {
    var index = this.content.indexOf(offset),
        descriptor;

    if(index < 0)
      throw "Failed to retrieve marker for offset: " + offset;

    descriptor = {
      marker: this.content.at(index),
      offset: offset
    };

    descriptor.offset = offset - descriptor.marker.offset;
    return descriptor;
  };


  /**
   * @class
   * */
  var RangeHighlighter = function (count)
  {
    var classes = [ Css.highlight,
                    Css.highlight + '-' + count ].join(' ');

    this.do = function (range) {
      range.surround(classes + ' ' + Css.highlight + '-id-'
                     + RangeHighlighter.id);

      return RangeHighlighter.id ++;
    };

    this.undo = function (id) {
      var coll = $('.' + Css.highlight + '-id-' + id);
      coll.each(function () {
        var el = $(this);

        el.contents().insertBefore(el);
        el.remove();
      } );
    };
  };

  RangeHighlighter.id = 0;


  /**
   * @class
   * */
  var Range = function (content, start, end)
  {
    /* TODO: ensure range is valid: end is child of start or conversely. */
    this.content = content;
    this.start = start;
    this.end = end;
  };

  Range.prototype.surround = function (className)
  {
    /* Optimised case: highlight does not span multiple nodes. */
    if(this.start.marker.node === this.end.marker.node) {
      this.surround_(this.start, this.start.offset,
                     this.end.offset, className);
      return;
    }

    var self = this,
        visitor = new TextNodeVisitor(this.start.marker.node),
        end = this.end.marker.node,
        coll = [ ];

    visitor.next();
    while(visitor.current != end) {
      coll.push(visitor.current);
      visitor.next();
    }

    this.surround_(this.start, this.start.offset, null, className);
    coll.forEach(function (n) { self.surround_whole_(n, className); } );
    this.surround_(this.end, 0, this.end.offset, className);
  };

  /* Private interface */
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

  Range.prototype.surround_whole_ = function (node, className)
  {
    $('<span/>')
      .addClass(className)
      .insertBefore(node)
      .append(node);
  };


  /**
   * @class
   * */
  var TextNodeVisitor = function (root)
  {
    /* Attributes */
    var current = root;

    /* Getters */
    Object.defineProperty(
      this, 'current', { get: function () { return current; } });

    /* Public interface */
    this.next = function ()
    {
      if(current.nodeType !== 3)
        throw "Invalid node type: not text";

      current = nextText_(nextNode_(current));
    };

    /* Private interface */
    function nextNode_ (node)
    {
      if(node.nextSibling !== null)
        return node.nextSibling;

      return nextNode_(node.parentNode);
    }

    function nextText_(node)
    {
      if(node.nodeType === 3)
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

    finder = new std.TemplateFinder('text/hh-template');
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
        }, 250);

        self.nodes.expander.addClass(Css.enabled);
      } else {
        el.css('overflow-y', 'hidden');
        self.nodes.expander.removeClass(Css.enabled);
      }
    } );


    /* Initial empty state. */
    this.setEmpty_();

    console.info('HTML highlighter UI instantiated');
  };

  Ui.prototype = Object.create(std.Owned.prototype);

  Ui.prototype.update = function ()
  {
    if(!this.options) return false;

    this.nodes.statsCurrent.html(this.owner.stats.current);
    this.nodes.statsTotal.html(this.owner.stats.total);

    if(this.templates.entityRow === null)
      return;
    else if(std.is_obj_empty(this.owner.queries)) {
      this.setEmpty_();
      return;
    }

    /* Template `entity-row´ must supply an LI element skeleton. */
    var elu = $('<ul/>'),
        tpl = $(this.templates.entityRow.innerHTML);

    for(var k in this.owner.queries) {
      var eli = tpl.clone();
      eli.find('[data-hh-scope="name"]').text(k);
      eli.find('[data-hh-scope="count"]')
        .text(this.owner.queries[k].set.length);
      elu.append(eli);
    }

    this.nodes.entities.children().remove();
    this.nodes.entities.append(elu);
  };

  Ui.prototype.setEmpty_ = function ()
  {
    this.nodes.entities.children().remove();

    if(this.templates.entityEmpty !== null)
      this.nodes.entities.append($(this.templates.entityEmpty.innerHTML));
  };


  var Css = {
    highlight: 'hh-highlight',
    enabled: 'hh-enabled'
  };


  /* API export */
  return {
    HtmlHighlighter: Main,
    HtmlHighlighterUi: Ui
  };

}, this);