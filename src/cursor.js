import {Css} from "./consts.js";
import {is_arr, inview, scrollIntoView} from "./util.js";

/**
 * <p>Class responsible for managing the state of the highlight cursor.</p>
 * @class
 * @param {Object} owner - Reference to the owning instance.
 * */
class Cursor
{
  constructor(owner)
  {
    this.owner = owner;
    this.index = -1;
    this.iterableQueries = null;
    this.total = 0;
    this.setIterableQueries(null);
  }

  /**
   * <p>Clear the current cursor state and recalculate number of total
   * iterable highlights.</p> */
  clear()
  {
    this.clearActive_();
    this.index = -1;
    this.update();
  }

  /**
   * <p>Set or clear the query sets that the cursor can move through.<p>
   *
   * <p>When one or more query sets are specified, cursor movement is
   * restricted to the specified query sets.  When setting the cursor offset,
   * the offset will then apply within the context of the active iterable
   * query sets.<p>
   *
   * <p>The restriction can be lifted at any time by passing <code>null</code>
   * to the method.</p>
   *
   * @param {(Array|string)} queries - An array (or string) containing the
   * query set names. */
  setIterableQueries(queries)
  {
    if(queries === null) {
      this.iterableQueries = null;
    } else {
      this.iterableQueries = is_arr(queries) ? queries.slice() : [queries];
    }

    this.clear();
  }

  /**
   * <p>Update the total of iterable highlights.<p>
   * <p>Does <strong>not</strong> update the UI state.  The caller is
   * responsible for doing so.</p>. */
  update()
  {
    const iterable = this.iterableQueries;
    if(iterable === null) {
      this.total = this.owner.stats.total;
      return;
    } else if(iterable.length === 0) {
      this.total = 0;
      return;
    }

    let markers = this.owner.highlights,
        total = 0;
    for(let i = markers.length - 1; i >= 0; --i) {
      if(iterable.indexOf(markers[i].query.name) >= 0) ++total;
    }

    this.total = total;
  }

  /**
   * <p>Set cursor to query referenced by absolute query index.</p>
   *
   * @param {integer} index - Virtual cursor index */
  set(index, dontRecurse)
  {
    const owner = this.owner;
    const markers = owner.highlights;

    if(index < 0) {
      throw new Error("Invalid cursor index specified: " + index);
    } else if(owner.stats.total <= 0) {
      return;
    }

    let count = index,
        ndx = null;
    const iterable = this.iterableQueries;

    markers.some(function(m, i) {
      const q = m.query;
      if(!q.enabled) {
        return false;
      } else if(iterable !== null && iterable.indexOf(q.name) < 0) {
        return false;
      } else if(count === 0) {
        ndx = i;
        return true;
      }

      --count;
      return false;
    });

    /* If index overflown, set to first highlight. */
    if(ndx === null) {
      if(!dontRecurse) this.set(0, true);
      return;
    }

    /* Clear currently active highlight, if any, and set requested highlight
     * active. */
    this.clearActive_();
    const c = markers[ndx];
    let $el = $("." + Css.highlight + "-id-" + (c.query.id + c.index))
          .addClass(Css.enabled)
          .eq(0);

    /* Scroll viewport if element not visible. */
    if(typeof owner.options.scrollTo !== "undefined") {
      owner.options.scrollTo($el);
    } else if(!inview($el)) {
      scrollIntoView($el, owner.options.scrollNode);
    }

    this.index = index;
  }

  /* Private interface
   * ----------------- */
  /**
   * <p>Clear the currently active cursor highlight.  The active cursor
   * highlight is the element or elements at the current cursor position.</p>
   * @access private
   * */
  clearActive_()
  { $("." + Css.highlight + "." + Css.enabled).removeClass(Css.enabled); }
}

export default Cursor;