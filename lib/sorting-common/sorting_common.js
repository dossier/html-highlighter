/**
 * @file The Sorting Desk's base module.
 * @copyright 2015 Diffeo
 *
 * Comments:
 *
 */


/*global $, define */
/*jshint laxbreak:true */



(function (factory, root) {

  /* Compatibility with RequireJs. */
  if(typeof define === "function" && define.amd) {
    define("SortingCommon", [ "jquery" ], function ($) {
      return factory(root, $);
    });
  } else
    root.SortingCommon = factory(root, $);

} )(function (window, $) {

  /* Module-wide function */
  var absm_noti = function ( ) { throw "Abstract method not implemented"; };

  var is_obj = function (r) { return r !== null && typeof r === 'object'; };
  var is_fn  = function (r) { return typeof r === 'function'; };
  var is_und = function (r) { return typeof r === typeof undefined; };
  var is_arr = function (r) { return r instanceof Array; };

  var is_str = function (r)
  { return typeof r === 'string' || r instanceof String; };

  var is_num = function (r)
  { return typeof r === 'number' || r instanceof Number; };

  var is_in  = function (/* (r, k) | (r, k0..n) */)
  {
    var r = arguments[0];

    if(!like_obj(r))
      throw "Reference not provided or not an object";

    for(var i = 1; i < arguments.length; ++i) {
      if(!r.hasOwnProperty(arguments[i]))
        return false;
    }

    return true;
  };

  var any_in  = function (/* (r, k) | (r, k0..n) */)
  {
    var r = arguments[0];

    if(!like_obj(r))
      throw "Reference not provided or not an object";

    for(var i = 1; i < arguments.length; ++i) {
      if(r.hasOwnProperty(arguments[i]))
        return true;
    }

    return false;
  };

  var like = function (l, r) { return r instanceof Object && l instanceof r; };
  var like_obj = function (r) { return r instanceof Object; };

  var first_key = function (obj)
  {
    if(!like_obj(obj))
      throw "Invalid object reference specified";

    for(var k in obj)
      return k;

    return null;
  };

  var next_key = function (obj, key)
  {
    if(!like_obj(obj))
      throw "Invalid object reference specified";

    var coll = Object.keys(obj),
        index = coll.indexOf(key);

    return index === -1 || index >= coll.length ? null : coll[index + 1];
  };

  var chainize = function (context, fn)
  {
    return function () {
      fn.apply(context, arguments);
      return context;
    };
  };

  var instanceany = function ()
  {
    var a = arguments, o = a[0];
    for(var i = 1, l = a.length; i < l; ++i) {
      if(o instanceof a[i])
        return true;
    }

    return false;
  };

  var on_exception = function (x)
  {
    console.error("Exception thrown: " + x,
                  x.stack || "\n<no stack information available>");

    throw x;
  };

  var is_obj_empty = function (x)
  {
    if(!like_obj(x))
      throw "Reference not provided or not an object";

    for(var k in x) {
      if(x.hasOwnProperty(k))
        return false;
    }

    return true;
  };


  /* jQuery-related */
  var jQueryExtensions = (function () {

    /* Interface
     * -- */
    /** Given a map of <code>identifier</code> -> <code>jQuery</code> instance
     * references, unbind all events on all nodes. The map can be multiple
     * levels deep, with each level processed recursively. This function can
     * never be a jQuery plugin.
     *
     * @param {Object} n - Object containing jQuery instance references and
     * possibly other objects.
     *
     * @returns {undefined} */
    var alloff = function (n)
    {
      for(var k in n) {
        var i = n[k];

        if(i instanceof $) i.off();
        else if(is_obj(i)) alloff(i);
      }
    };

    /** Convenient method that returns true if a given variable contains a valid
     * reference to a <code>jQuery</code> instance.
     *
     * @param {Object} r - Variable to test.
     *
     * @returns {boolean} True, if <code>r</code> is a <code>jQuery</code>
     * instance. */
    var is = function (r)
    { return r instanceof $; };

    /** Convenient method meant to be used as a means of ensuring a given
     * variable contains a valid reference to a <code>jQuery</code> instance and
     * that it isn't empty.
     *
     * @param {Object} r - Variable to test.
     *
     * @returns {boolean} True, if <code>r</code> is a <code>jQuery</code>
     * instance <strong>and</strong> contains at least one element; False
     * otherwise. */
    var any = function (r)
    { return is(r) && r.length > 0; };

    /** Returns true if two jQuery collections contain the exact same DOM
     * elements.
     *
     * @param {Object} l - Left collection to test.
     * @param {Object} r - Right collection to test.
     *
     * @returns {boolean} True, if <code>r</code> contains the same DOM
     * elements as <code>l</code>.  This implies that the collections of both
     * <code>l</code> and <code>r</code> contain the same number of elements
     * too. */
    var same = function (l, r)
    {
      if(!is(l) || !is(r))
        throw "Invalid jQuery reference(s) specified";
      else if(l.length !== r.length)
        return false;

      for(var i = 0, c = l.length; i < c; ++i) {
        if(l.get(i) !== r.get(i))
          return false;
      }

      return true;
    };

    var inview = function (el)
    {
      if(!is(el))
        el = $(el);

      var $window = $(window),
          docTop = $window.scrollTop(),
          docBottom = docTop + $window.height(),
          top = el.offset().top,
          bottom = top + el.height();

      return ((bottom <= docBottom) && (top >= docTop));
    };

    var scrollIntoView = function (el, c)
    {
      if(!is(el))
        el = $(el);

      var container = c === undefined ? $(window) : (is(c) ? c : $(c)),
          containerTop = container.scrollTop(),
          containerBottom = containerTop + container.height(),
          elemTop = el.offset().top,
          elemBottom = elemTop + el.height();

      if (elemTop < containerTop)
        container.off().scrollTop(elemTop);
      else if (elemBottom > containerBottom)
        container.off().scrollTop(elemBottom - container.height());
    };


    /* Public interface */
    return {
      alloff: alloff,
      is: is,
      any: any,
      same: same,
      inview: inview,
      scrollIntoView: scrollIntoView
    };

  } )();


  var Html = (function () {

    /* Interface
     * -- */
    /** This method retrieves image data in base64 encoding. It can either be
     * passed a reference to an existing <code>Image</code> instance or a string
     * assumed to contain the URL of an image. When given a string, it attempts
     * to first load the image before retrieving its image data.
     *
     * In both instances, a jQuery <code>Deferred</code> promise object is
     * returned and is resolved as soon as the image data is available. The
     * promise is only rejected when attempting to load the image fails.
     *
     * @param {(object|string)} ent - Can be either a reference to an
     * <code>Image</code> instance or a string assumed to contain the URL of an
     * image.
     *
     * @returns {string} Image data in base64 encoding without the prefix
     * <code>data:image/TYPE;base64,</code>. */
    var imageToBase64 = function (ent)
    {
      var deferred = $.Deferred();

      if(is_image(ent)) {
        window.setTimeout(function () {
          var data = getImageData_(ent);
          deferred.resolve(data);
        }, 0);
      } else if(is_str(ent)) {
        var img;

        ent = ent.trim();
        img = new window.Image();
        img.src = /^\/\//.test(ent) ? "http:" + ent : ent;

        /* Set up events. */
        img.onload = function () { deferred.resolve(getImageData_(img)); };
        img.onerror = function () {
          console.error("Failed to load image: %s", img.src);
          deferred.reject();
        };
      } else
        throw "Invalid image source specified";

      return deferred.promise();
    };

    var xpathOf = function (node)
    {
      var id, xpath = '';

      if(jQueryExtensions.is(node))
        node = node.get(0);

      for( ; node !== null && node.nodeType === 1 || node.nodeType === 3;
           node = node.parentNode) {
        id = indexOf(node) + 1;
        xpath = '/' + node.nodeName.toLowerCase()
          + (id === 1 ? '' : '[' + id + ']')
          + xpath;
      }

      return xpath;
    };

    var indexOf = function (node)
    {
      var index = 0;

      while( (node = node.previousSibling) !== null)
        ++ index;

      return index;
    };

    var visit = function (node, cb)
    {
      if(!is_fn(cb))
        throw 'Invalid or no callback function specified';

      var visitor = function (el) {
        var children = el.childNodes;

        if(children.length) {
          for(var i = 0, l = children.length; i < l; ++i)
            visitor(children[i]);
        } else
          cb(el);
      };

      visitor(node);
    };

    var subtreeBetween = function (node, parent /* = document.body */)
    {
      if(parent === undefined)
        parent = document.body;

      var subtree = [ node ];

      while(node !== parent) {
        node = node.parentNode;
        if(node === null)
          return [ ];

        subtree.push(node);
      }

      return subtree;
    }


    /* Is-type functions */
    var is_image = function (el)
    {
      return el instanceof window.HTMLImageElement
        || el instanceof window.Image;
    };

    /* Private interface */
    var getImageData_ = function (img)
    {
      var canvas = window.document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;

      var ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);

      return canvas.toDataURL("image/png");
    };


    /* Public interface */
    return {
      imageToBase64: imageToBase64,
      xpathOf: xpathOf,
      is_image: is_image,
      visit: visit,
      subtreeBetween: subtreeBetween
    };

  } )();


  /**
   * @class
   * */
  var NodeFinder = function (tag, prefix, root)
  {
    this.tag_ = tag;
    this.prefix_ = [ '[', tag, '="',
                     prefix && prefix.length > 0 ? prefix + '-' : ''
                   ].join('');
    this.root_ = root;
  };

  NodeFinder.prototype = {
    tag_: null,
    prefix_: null,
    root_: null,

    get root() { return this.root_;  },

    find: function (scope, parent /* = prefix */ )
    {
      var p;

      if(parent instanceof $) p = parent;
      else if(is_str(parent)) p = this.find(parent);
      else                    p = this.root_;

      return p.find( [ this.prefix_, scope, '"]' ].join(''));
    },

    withroot: function (newRoot, callback)
    {
      if(!is_fn(callback))
        throw "Invalid or no callback function specified";

      var nf = new NodeFinder(this.tag_, this.prefix_, newRoot);
      return callback.call(this);
    }
  };


  /**
   * @class
   * */
  var TemplateFinder = function (type, tag)
  {
    this.scripts = Array.prototype.slice.call(
      document.getElementsByTagName('script'), 0)
      .filter(function (i) {
        return i.type === type;
      } );

    this.tag = tag || 'data-scope';
  };

  TemplateFinder.prototype.find = function (id)
  {
    for(var i = 0, l = this.scripts.length; i < l; ++i) {
      if(this.scripts[i].id === id)
        return new Template(this.scripts[i].innerHTML, this.tag);
    }

    return null;
  };


  /**
   * @class
   * */
  var Template = function (html, tag)
  {
    this.html = html;
    this.tag = tag || null;

    Object.defineProperty(this, 'html', { value: html } );
  };

  Template.prototype.clone = function ()
  {
    return new TemplateInstance($(this.html), this.tag);
  };


  /**
   * @class
   * */
  var TemplateInstance = function (node, tag)
  {
    this.node = node;
    this.tag = tag || null;
  };

  TemplateInstance.prototype.get = function () { return this.node; };

  TemplateInstance.prototype.find = function (scope)
  {
    if(this.prefix === null) return $();
    return this.node.find('[' + this.tag + '=' + scope + ']');
  };


  /**
   * @class
   * */
  var Url = (function () {
    /* Public interface */
    return {
      encode: function (s)
      {
        /* Taken from: http://goo.gl/kRTxRW
         * (Javascript's default `encodeURIComponent` does not strictly conform to
         * RFC 3986.) */
        return encodeURIComponent(s).replace(/[!'()*]/g, function(c) {
          return '%' + c.charCodeAt(0).toString(16);
        });
      },
      decode: function (s)
      {
        return decodeURIComponent(s);
      }
    };
  } )();


  /**
   * @class
   * */
  var /* abstract */ Owned = function (owner)
  {
    if(!like_obj(owner))
      throw "Invalid owner instance reference specified";

    /* Getters */
    Object.defineProperty(this, 'owner', {
      get: function () { return this.owner_; } } );

    /* Attributes */
    this.owner_ = owner;
  };


  /**
   * @class
   * */
  var /* abstract */ Controller = function (owner)
  {
    /* Invoke super constructor. */
    Owned.call(this, owner);
  };

  /* Following method to allow for deferred initialisation. */
  /* abstract */ Controller.prototype.initialise = absm_noti;

  /* abstract */ Controller.prototype.reset = absm_noti;


  /**
   * @class
   * */
  var /* abstract */ Drawable = function (owner)
  {
    /* Invoke super constructor. */
    Owned.call(this, owner);
  };

  /* abstract */ Drawable.prototype.render = absm_noti;


  /**
   * @class
   * */
  var Callbacks = function (map)
  {
    if(!is_und(map)) {
      if(!is_obj(map))
        throw "Invalid callbacks map specified";

      /* Ensure all attributes in the map are functions. */
      for(var k in map) {
        if(!is_fn(map[k]))
          throw "Invalid callback found: " + k;
      }

      this.map_ = map;
    } else
      this.map_ = { };
  };

  Callbacks.prototype.exists = function (callback)
  { return this.map_.hasOwnProperty(callback); };

  /** Invoke a callback with optional parameters.
   *
   * The callback is always required to exist. If it doesn't exist, an
   * exception is thrown.
   *
   * @param {string} name       - Name of callback to invoke.
   * @param {*}      parameters - One or more parameters to pass to callback.
   * */
  Callbacks.prototype.invoke = function ( /* (name, arg0..n) */ )
  {
    if(arguments.length < 1)
      throw "Callback name not specified";

    return this.call_(arguments[0], true,
                      Array.prototype.splice.call(arguments, 1));
  };

  /** Invoke a callback with optional parameters <strong>if</strong> it
   * exists.
   *
   * The callback is not required to exist and, in thie event,
   * <code>null</code> is returned.
   *
   * @param {string} name       - Name of callback to invoke.
   * @param {*}      parameters - One or more parameters to pass to callback.
   * */
  Callbacks.prototype.invokeMaybe = function ( /* (name, arg0..n) */ )
  {
    if(arguments.length < 1)
      throw "Callback name not specified";

    return this.call_(arguments[0], false,
                      Array.prototype.splice.call(arguments, 1));
  };

  /** Invoke a callback with optional parameters.
   *
   * The callback may optionally <strong>not</strong> be required to exist if
   * the <code>mandatory</code> argument is <code>false</code>, in which case
   * no further action is taken and <code>null</code> is returned.
   *
   * @param {string}  name      - Name of callback to invoke.
   *
   * @param {boolean} mandatory - If true, the callback must exist and an
   * exception is thrown if it doesn't.
   *
   * @param {*}       parameters - One or more parameters to pass to callback.
   * */
  Callbacks.prototype.call = function (/* (name, mandatory = true, arg0..n) */)
  {
    if(arguments.length < 2)
      throw "One or more parameters missing (name, mandatory)";

    return this.call_(arguments[0], arguments[1],
                      Array.prototype.splice.call(arguments, 2));
  };

  /* overridable */ Callbacks.prototype.onPostCall = function (name, result)
  { /* nop */ };

  /* Private methods */
  Callbacks.prototype.call_ = function (name, mandatory, args)
  {
    if(!is_str(name))
      throw "Invalid callback name specified";

    var callback = this.map_[name];
    if(!is_fn(callback)) {
      if(mandatory === true)
        throw "Attempting to invoke nonexistent callback: " + name;

      return null;
    }

    var result = callback.apply(null, args);
    this.onPostCall(name, result);
    return result;
  };


  /**
   * @class
   * */
  var Constructor = function (map)
  {
    if(!is_obj(map))
      throw "Invalid map of constructors given";

    /* Ensure all attributes in the map are functions. */
    for(var k in map) {
      if(!is_fn(map[k]))
        throw "Invalid constructor found: " + k;
    }

    /* Attributes */
    this.map_ = map;
  };

  /* Static interface */
  Constructor.exists = function (obj, name)
  {
    if(!like_obj(obj))
      throw "Invalid or no object specified";

    return any_in(obj, name, 'create' + name);
  };

  /* Instance interface */
  Constructor.prototype.exists = function (name)
  {
    return any_in(this.map_, name, 'create' + name);
  };

  Constructor.prototype.hasFactoryMethod = function (name)
  {
    return this.map_.hasOwnProperty('create' + name);
  };

  Constructor.prototype.hasConstructor = function (name)
  {
    return this.map_.hasOwnProperty(name);
  };

  Constructor.prototype.isConstructor = function (name)
  {
    return !this.hasFactoryMethod(name) && this.hasConstructor(name);
  };

  Constructor.prototype.instantiate = function ( /* (class, arg0..n) */ )
  {
    if(arguments.length < 1)
      throw "Class name required";

    /* Invoke factory method to instantiate class, if it exists. */
    var descriptor = this.map_['create' + arguments[0]];

    if(descriptor)
      return descriptor.apply(null, [].slice.call(arguments, 1));

    /* Factory method doesn't exist. Ensure class constructor has been passed
     * and instantiate it. */
    descriptor = this.map_[arguments[0]];

    if(!descriptor)
      throw "Class or factory non existent: " + arguments[0];

    /* We don't want to use `eval' so we employ a bit of trickery to
     * instantiate a class using variable arguments. */
    var FakeClass = function () { },
        object;

    /* Instantiate class prototype. */
    FakeClass.prototype = descriptor.prototype;
    object = new FakeClass();

    /* Now simply call class constructor directly and keep reference to
     * correct constructor. */
    descriptor.apply(object, [].slice.call(arguments, 1));
    object.constructor = descriptor.constructor;

    return object;
  };


  /**
   * @class
   * */
  var ControllerGlobalKeyboard = function (owner)
  {
    /* Invoke super constructor. */
    Controller.call(this, owner);
  };

  ControllerGlobalKeyboard.prototype = Object.create(Controller.prototype);

  ControllerGlobalKeyboard.prototype.fnEventKeyUp = null;

  /* Required: */
  /* abstract */ ControllerGlobalKeyboard.prototype.onKeyUp = null;

  ControllerGlobalKeyboard.prototype.initialise = function ()
  {
    var self = this;

    /* Save event handler function so we are able to remove it when resetting
     * the instance. */
    this.fnEventKeyUp = function (evt) { self.onKeyUp(evt); };

    /* Set up listener for keyboard up events. */
    $('body').bind('keyup', this.fnEventKeyUp);
  };

  ControllerGlobalKeyboard.prototype.reset = function ()
  {
    /* Remove keyboard up event listener. */
    $('body').unbind('keyup', this.fnEventKeyUp);
    this.fnEventKeyUp = null;
  };


  /**
   * @class
   *
   * Static class.
   * */
  var DragDropManager = (function () {
    var activeNode = null;

    /* Interface */
    var isScope = function (event, scopes)
    {
      if(!scopes)
        return true;

      var isFilter = is_fn(scopes);

      if(!activeNode)
        return isFilter && scopes(null);

      var current = activeNode.getAttribute('data-scope');

      return isFilter
        ? scopes(current)
        : hasScope(scopes, current);
    };

    var getScope = function (event)
    {
      return activeNode
        ? activeNode.getAttribute('data-scope')
        : null;
    };

    var hasScope = function (all, target)
    {
      return (is_arr(all) ? all : [ all ])
        .some(function (s) {
          return s === target;
        } );
    };

    /* Event handlers */
    var onDragStart = function (event) {
      activeNode = (event.originalEvent || event).target;
    };

    var onDragEnd = function (event) {
      if(activeNode === (event.originalEvent || event).target) {
        activeNode = null;
      }
    };

    var reset = function () { activeNode = null; };


    /* Public interface */
    return {
      isScope: isScope,
      getScope: getScope,
      hasScope: hasScope,
      reset: reset,
      onDragStart: onDragStart,
      onDragEnd: onDragEnd
    };
  } )();


  /**
   * @class
   * */
  var Draggable = function (node, options)
  {
    node.on( {
      dragstart: function (e) {
        /* Note: event propagation needs to be stopped before assignment of
         * `originalEvent' or some tests will break. */
        e.stopPropagation();
        e = e.originalEvent;
        e.dataTransfer.setData('Text', ' ');
        e.dataTransfer.setData('DossierId', this.id);

        if(options.classDragging)
          node.addClass(options.classDragging);

        DragDropManager.onDragStart(e);

        if(options.dragstart)
          options.dragstart(e);
      },

      dragend: function (e) {
        /* Note: event propagation needs to be stopped before assignment of
         * `originalEvent' or some tests will break. */
        e.stopPropagation();
        e = e.originalEvent;

        if(options.classDragging)
          node.removeClass(options.classDragging);

        DragDropManager.onDragEnd(e);

        if(options.dragend)
          options.dragend(e);
      }
    } ).prop('draggable', true);
  };


  /**
   * @class
   * */
  var Droppable = function (node, options)
  {
    var dm = DragDropManager;

    if(!(node instanceof $))
      throw "Invalid or no jQuery reference specified";

    /* Attributes */
    this.options_ = options;
    this.node_ = node;

    /* Set up events on node provided. */
    node.on( {
      dragover: function (e) {
        if(!dm.isScope(e = e.originalEvent, options.scopes))
          return;

        /* Drag and drop has a tendency to suffer from flicker in the sense that
         * the `dragleave' event is fired while the pointer is on a valid drop
         * target but the `dragenter' event ISN'T fired again, causing the
         * element to lose its special styling -- given by `options.classHover'
         * -- and its `dropEffect'. We then need re-set everything in the
         * `dragover' event. */
        if(options.classHover)
          node.addClass(options.classHover);

        e.dropEffect = 'move';
        return false;
      },

      dragenter: function (e) {
        /* IE requires the following special measure. */
        if(!dm.isScope(e = e.originalEvent, options.scopes))
          return;

        e.dropEffect = 'move';
        return false;
      },

      dragleave: function (e) {
        if(!dm.isScope(e = e.originalEvent, options.scopes))
          return;

        if(options.classHover)
          node.removeClass(options.classHover);

        return false;
      },

      drop: function (e) {
        if(!dm.isScope(e = e.originalEvent, options.scopes))
          return;

        if(options.classHover)
          node.removeClass(options.classHover);

        if(options.drop) {
          /* The following try-catch is required to prevent the drop event from
           * bubbling up, should an error occur inside the handler. */
          try {
            options.drop(
              e,
              e.dataTransfer && e.dataTransfer.getData('DossierId') || null,
              dm.getScope());
          } catch (x) {
            console.error("Exception occurred:", x);
          }
        }

        /* Forcefully reset state as some drag and drop events don't cause the
         * dragleave event to be fired at the end. */
        dm.reset();

        return false;
      }
    } );
  };

  Droppable.prototype.add = function (scope)
  {
    if(!is_arr(this.options_.scopes))
      this.options_.scopes = [ ];

    if(this.options_.scopes.indexOf(scope) === -1)
      this.options_.scopes.push(scope);
  };

  Droppable.prototype.remove = function (scope)
  {
    if(is_arr(this.options_.scopes)) {
      var index = this.options_.scopes.indexOf(scope);
      if(index !== -1)
        this.options_.scopes.splice(index, 1);
    }
  };

  Droppable.prototype.reset = function ()
  {
    /* Clear all events.
     *
     * Note that this may be undesirable since all the events attached to the
     * element are cleared, including any events the client may have set
     * up. */
    this.node_.off();
    this.node_ = this.options_ = null;
  };


  /**
   * @class
   * */
  var Observable = function ()
  {
    /* Attributes */
    this.observers_ = [ ];
  };

  Observable.prototype.exists = function (observer)
  {
    return this.observers.some(function (ob) {
      return ob == observer;
    } );
  };

  Observable.prototype.register = function (observer)
  {
    if(this.exists(observer))
      throw "Observer already registered";
    else if(typeof observer !== 'function' && !(observer instanceof Observer))
      throw "Invalid observer instance or function reference specified";

    this.observers_.push(observer);
  };

  Observable.prototype.unregister = function (observer)
  {
    var index = this.observers_.indexOf(observer);

    if(index !== -1) {
      this.observers_.splice(index, 1);
      return;
    }

    throw "Observer not registered";
  };

  Observable.prototype.notify = function ( /* (arg0..n) */ )
  {
    this.observers_.forEach(function (observer) {
      /* `observer´ here may be either a function or is expected to be a class
       * instance implementing a method by the name `update´.  */
      if(typeof observer === 'function')
        observer.apply(observer, arguments);
      else
        observer.update.apply(observer, arguments);
    } );
  };


  /**
   * @class
   * */
  var Observer = function (owner, callback)
  {
    Owned.call(this, owner);

    if(!is_fn(callback))
      throw "Invalid or no callback function specified";

    /* Attributes */
    this.callback_ = callback;
  };

  Observer.prototype = Object.create(Owned.prototype);

  Observer.prototype.update = function ( /* (arg0..argn) */ )
  {
    this.callback_.apply(null, arguments);
  };


  /**
   * @class
   * */
  var Events = function ( /* <owner, names> | <names> */ )
  {
    var ent;

    /* Attributes */
    this.map_ = { };

    /* Initialisation proper
     * -- */
    /* Allow a reference to an owning reference to have not been specified. If
     * it was specified, add an `on´ and `off´ methods to its instance, if each
     * doesn't already exist. Note that we are not making any checks to ensure
     * the owning instance is a valid instantiated prototypal object. */
    if(arguments.length === 2) {
      ent = this.owner_ = arguments[0];

      if(!like_obj(ent))
        throw "Invalid owner instance reference specified";

      /* Decorate owning instance by adding the `on´ and `off´ methods that
       * clients can conveniently use to attach and deattach events,
       * respectively. */
      if(!ent.hasOwnProperty('on'))
        ent.on = chainize(ent, this.register.bind(this));

      if(!ent.hasOwnProperty('off'))
        ent.off = chainize(ent, this.unregister.bind(this));

      ent = arguments[1];
    } else {
      this.owner_ = null;
      ent = arguments[0];
    }

    /* It is assumed that the events a class advertises do not change since they
     * are directly related to the class' responsibilities and purpose, -- thus
     * its very identity -- and not state at any particular point in time. We
     * therefore require an array at instantiation time, given by `names´,
     * containing a list of event names clients can subsequently register
     * callbacks to.
     * -- */
    /* Prepare event callback containers. */
    if(!is_arr(ent))
      throw "Invalid or no event array specified";

    var self = this;
    ent.forEach(function (n) { self.map_[n] = [ ]; } );
  };

  Events.prototype.add = function (ev)
  {
    if(!is_str(ev) || ev.length === 0)
      throw "Invalid or no event name specified";
    else if(this.map_.hasOwnProperty(ev))
      throw "Event already exists: " + ev;

    this.map_[ev] = [ ];
    return true;
  };

  Events.prototype.remove = function (ev)
  {
    if(!is_str(ev) || ev.length === 0)
      throw "Invalid or no event name specified";
    else if(this.map_.hasOwnProperty(ev)) {
      delete this.map_[ev];
      return true;
    }

    return false;
  };


  Events.prototype.exists = function (ev)
  {
    ev = this.map_[ev];
    return is_arr(ev) ? ev.length > 0 : false;
  };

  Events.prototype.count = function (ev)
  {
    ev = this.map_[ev];
    return is_arr(ev) ? ev.length : -1;
  };

  Events.prototype.trigger = function ( /* (ev, arg0..n) */ )
  {
    var self = this,
        ev = arguments[0];

    if(!is_str(ev) || ev.length === 0)
      throw "Invalid or no event name specified";

    var d = this.map_[ev];
    if(is_arr(d)) {
      var args = Array.prototype.splice.call(arguments, 1);

      d.forEach(function (fn) {
        try {
          fn.apply(self.owner_, args);
        } catch(x) {
          on_exception(x);
        }
      } );
    }
  };

  Events.prototype.register = function ( /* (event, handler)
                                          * | { event0: handler0
                                          *     ..n              } */ )
  {
    if(arguments.length === 0)
      throw "No event descriptor specified";

    var ev = arguments[0];

    if(arguments.length === 1) {
      /* Expect a map. */
      if(is_obj(ev)) {
        var ct = 0,
            cg = 0;

        for(var k in ev) {
          ++ct;
          if(this.register_single_(k, ev[k])) ++cg;
        }

        return cg === ct;
      } else
        throw "Invalid event(s) descriptor map";
    } else /* arguments >= 2; only first two are used */
      return this.register_single_(ev, arguments[1]);
  };

  Events.prototype.unregister = function (/* undefined | string | object */
    ev, fn)
  {
    if(is_str(ev))                        /* Unregister single event. */
      return this.unregister_single_(ev, fn);
    else if(is_obj(ev)) {
      for(var k in ev)                    /* Unregister multiple events. */
        this.unregister_single_(ev[k]);
    } else if(is_und(ev))
      this.map_ = { };                    /* Unregister all.  */
    else
      throw "Invalid event(s) descriptor";
  };

  /* Protected methods */
  Events.prototype.register_single_ = function (ev, fn)
  {
    if(!is_str(ev) || ev.length === 0)
      throw "Invalid or no event name";
    else if(!is_fn(fn))
      throw "Invalid or no event handler specified";

    var callbacks = this.map_[ev];
    if(is_arr(callbacks)) {
      callbacks.push(fn);
      return true;
    }

    return false;
  };

  Events.prototype.unregister_single_ = function (ev, fn)
  {
    if(!is_str(ev) || ev.length === 0)
      throw "Invalid or no event name";

    if(!this.map_.hasOwnProperty(ev))
      return false;

    if(is_und(fn))
      this.map_[ev] = [ ];
    else if(!is_fn(fn))
      throw "Invalid or no event handler specified";
    else {
      var index = this.map_[ev].indexOf(fn);
      if(index === -1)
        return false;

      this.map_splice(index, 1);
    }

    return true;
  };


  /**
   * @class
   * */
  var View = function (owner)
  {
    /* Invoke super constructor. */
    Drawable.call(this, owner);
  };

  View.prototype = Object.create(Drawable.prototype);

  View.prototype.reset = absm_noti;


  /**
   * @class
   * */
  var Position = function (l, t)
  {
    if(arguments.length === 2) this.set(l, t);
    else this.set(0, 0);

    this.__defineGetter__("left", function () { return this.left_; } );
    this.__defineGetter__("top", function () { return this.top_; } );

    this.__defineSetter__("left", function (l) { this.left_ = l; } );
    this.__defineSetter__("top", function (t) { this.top_ = t; } );
  };

  Position.prototype.set = function (l, t)
  {
    this.left_ = l;
    this.top_ = t;
  };


  /**
   * @class
   * */
  var Size = function (w, h)
  {
    if(arguments.length === 2) this.set(w, h);
    else this.set(0, 0);

    this.__defineGetter__("width", function () { return this.width_; } );
    this.__defineGetter__("height", function () { return this.height_; } );

    this.__defineSetter__("width", function (w) { this.width_ = w; } );
    this.__defineSetter__("height", function (h) { this.height_ = h; } );
  };

  Size.prototype.set = function (w, h)
  {
    this.width_ = w;
    this.height_ = h;
  };


  /**
   * @class
   * */
  var PositionSize = function (l, t, w, h)
  {
    if(arguments.length === 1) {
      if(!is_obj(l))
        throw "Invalid or no object specified";

      this.set(l.left, l.top, l.width, l.height);
    } else if(arguments.length === 4) this.set(l, t, w, h);
    else this.set(0, 0, 0, 0);

    /* Getters */
    this.__defineGetter__("left", function () { return this.left_; } );
    this.__defineGetter__("top", function () { return this.top_; } );

    this.__defineGetter__("right", function () {
      return this.width_ > 0 ? this.left_ + this.width_ - 1 : this.left_; } );

    this.__defineGetter__("bottom", function () {
      return this.height_ > 0 ? this.top_ + this.height_ - 1 : this.top_; } );

    /* Setters */
    this.__defineGetter__("width", function () { return this.width_; } );
    this.__defineGetter__("height", function () { return this.height_; } );

    this.__defineSetter__("left", function (l) { this.left_ = l; } );
    this.__defineSetter__("top", function (t) { this.top_ = t; } );

    this.__defineSetter__("width", function (w) { this.width_ = w; } );
    this.__defineSetter__("height", function (h) { this.height_ = h; } );
  };

  /* Interface */
  PositionSize.prototype.set = function (l, t, w, h)
  {
    this.left_ = l;
    this.top_ = t;

    this.width_ = w;
    this.height_ = h;
  };

  PositionSize.prototype.toObject = function ()
  {
    return {
      left: this.left_,
      top: this.top_,
      width: this.width_,
      height: this.height_
    };
  };


  /* Return public interface. */
  return {
    /* Functions */
    absm_noti: absm_noti,
    is_obj: is_obj,
    is_fn: is_fn,
    is_und: is_und,
    is_arr: is_arr,
    is_str: is_str,
    is_num: is_num,
    like: like,
    like_obj: like_obj,
    first_key: first_key,
    next_key: next_key,
    is_in: is_in,
    any_in: any_in,
    chainize: chainize,
    instanceany: instanceany,
    on_exception: on_exception,
    is_obj_empty: is_obj_empty,

    /* Classes */
    Url: Url,
    Owned: Owned,
    Controller: Controller,
    Drawable: Drawable,
    Callbacks: Callbacks,
    Constructor: Constructor,
    ControllerGlobalKeyboard: ControllerGlobalKeyboard,
    Draggable: Draggable,
    Droppable: Droppable,
    Events: Events,
    View: View,
    NodeFinder: NodeFinder,
    TemplateFinder: TemplateFinder,
    $: jQueryExtensions,
    Html: Html,
    Size: Size,
    Position: Position,
    PositionSize: PositionSize
  };

}, this);