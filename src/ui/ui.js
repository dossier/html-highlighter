import $ from "jquery";

import {Css} from "../consts.js";
import TemplateFinder from "./templatefinder.js";
import NodeFinder from "./nodefinder.js";
import {is_$, is_obj_empty} from "../util.js";

/**
 * <p>Class responsible for updating the user interface widget, if one is
 * supplied.</p>
 *
 * @class
 * @param {Main} owner - reference to owning <code>Main</code> instance
 * @param {Object} options - map containing options
 * */
class Ui
{
  constructor(owner, options)
  {
    this.owner = owner;

    if(!is_$(options.widget)) {
      console.warn("HTML highlighter UI unavailable");
      Object.defineProperty(this, "options", {value: false});
      return;
    }

    Object.defineProperty(this, "options", {value: options});

    let finder = new NodeFinder("data-hh-scope", "", options.widget);

    this.root = finder.root;
    this.nodes = {
      statsCurrent: finder.find("stats-current"),
      statsTotal: finder.find("stats-total"),
      next: finder.find("button-next"),
      prev: finder.find("button-prev"),
      expander: finder.find("expand"),
      entities: finder.find("entities")
    };

    finder = new TemplateFinder("text/hh-template", "data-hh-scope");
    this.templates = {
      entityRow: finder.find("entity-row"),
      entityEmpty: finder.find("entity-empty")
    };

    this.timeouts = {};

    this.nodes.expander.click(() => {
      let el = this.nodes.entities;
      el.toggleClass(Css.enabled);

      if("entities" in this.timeouts) {
        window.clearTimeout(this.timeouts.entities);
        this.timeouts.entities = null;
      }

      if(el.hasClass(Css.enabled)) {
        this.timeouts.entities = window.setTimeout(() => {
          el.css("overflow-y", "auto");
          this.timeouts.entities = null;
        }, this.options.delays.toggleEntities);

        this.nodes.expander.addClass(Css.enabled);
      } else {
        el.css("overflow-y", "hidden");
        this.nodes.expander.removeClass(Css.enabled);
      }
    });

    this.nodes.entities.click((ev) => {
      const $node = $(ev.target);
      if($node.data("hh-scope") === "remove") {
        this.owner.remove(this.getName_($node)).apply();
      }
    });

    this.nodes.next.click(() => this.owner.next());
    this.nodes.prev.click(() => this.owner.prev());

    /* Initial empty state. */
    this.setEmpty_();
    this.update();

    // console.info("HTML highlighter UI instantiated");
  }

  /**
   * <p>Update the UI state.</p>
   *
   * <p>Does a full or partial update of the UI state.  A full update is done if
   * <code>full</code> is either unspecified (<code>undefined</code>) or
   * <code>true</code>, and consists of refreshing the query set list as well
   * as the cursor position and total.  A partial update merely refreshes
   * the cursor position and total.</p>
   *
   * @param {boolean} full - specifies whether to do a full update
   * */
  update(full)
  {
    if(!this.options) return false;

    this.nodes.statsCurrent.html(
      this.owner.cursor.index >= 0
        ? this.owner.cursor.index + 1
        : "-"
    );
    this.nodes.statsTotal.html(this.owner.cursor.total);

    if(full === false || this.templates.entityRow === null) {
      return;
    } else if(is_obj_empty(this.owner.queries)) {
      this.setEmpty_();
      return;
    }

    /* Template `entity-row´ must supply an LI element skeleton. */
    let $elu = $("<ul/>");

    Object.keys(this.owner.queries).forEach((k) => {
      const q = this.owner.queries[k];
      let $eli = this.templates.entityRow.clone();

      if(q.enabled) $eli.find("enable").prop("checked", true);

      $eli.find("name").text(k);
      $eli.find("count").text(q.length);
      $elu.append($eli.get());
    });

    $elu.click((ev) => {
      const $node = $(ev.target);
      if($node.data("hh-scope") === "enable") {
        if($node.prop("checked")) this.owner.enable(this.getName_($node));
        else                      this.owner.disable(this.getName_($node));

        this.owner.apply();
      }
    });

    this.nodes.entities.children().remove();
    this.nodes.entities.append($elu);
  }

  getName_($node)
  {
    return $node.parentsUntil("ul").last()
      .find('[data-hh-scope="name"]').text();
  }

  setEmpty_()
  {
    this.nodes.entities.children().remove();
    if(this.templates.entityEmpty !== null) {
      this.nodes.entities.append(this.templates.entityEmpty.clone().get());
    }
  }
}

export default Ui;