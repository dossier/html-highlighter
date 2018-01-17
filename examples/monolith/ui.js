// FIXME: refactor camel-case symbols
import { Css } from '../../src/consts';

import { TemplateFinder, NodeFinder } from './template';

/**
 * Class responsible for updating the user interface widget
 */
class UI {
  static DELAY_TOGGLEENTITIES = 250;

  /**
   * Class constructor
   *
   * @param {HtmlHighlighter} highlighter - reference to owning `HtmlHighlighter` instance
   * @param {Object} options - map containing options
   */
  constructor(highlighter, $widget) {
    this.highlighter = highlighter;

    let finder = new NodeFinder('data-hh-scope', '', $widget);

    this.root = finder.root;
    this.nodes = {
      statsCurrent: finder.find('stats-current'),
      statsTotal: finder.find('stats-total'),
      next: finder.find('button-next'),
      prev: finder.find('button-prev'),
      expander: finder.find('expand'),
      entities: finder.find('entities'),
    };

    finder = new TemplateFinder('text/hh-template', 'data-hh-scope');
    this.templates = {
      entityRow: finder.find('entity-row'),
      entityEmpty: finder.find('entity-empty'),
    };

    this.timeouts = {};

    this.nodes.expander.click(() => {
      let el = this.nodes.entities;
      el.toggleClass(Css.enabled);

      if ('entities' in this.timeouts) {
        window.clearTimeout(this.timeouts.entities);
        this.timeouts.entities = null;
      }

      if (el.hasClass(Css.enabled)) {
        this.timeouts.entities = window.setTimeout(() => {
          el.css('overflow-y', 'auto');
          this.timeouts.entities = null;
        }, UI.DELAY_TOGGLEENTITIES);

        this.nodes.expander.addClass(Css.enabled);
      } else {
        el.css('overflow-y', 'hidden');
        this.nodes.expander.removeClass(Css.enabled);
      }
    });

    this.nodes.entities.click(ev => {
      const $node = $(ev.target);
      if ($node.data('hh-scope') === 'remove') {
        this.highlighter.remove(this.getName_($node));
      }
    });

    this.nodes.next.click(() => this.highlighter.next());
    this.nodes.prev.click(() => this.highlighter.prev());

    highlighter.on('add', this.onQuerySetAdded);
    highlighter.on('remove', this.onQuerySetRemoved);
    highlighter.on('clear', this.onStateCleared);
    highlighter.on('enable', this.onQuerySetEnabled);
    highlighter.on('disable', this.onQuerySetDisabled);
    highlighter.cursor.on('clear', this.onCursorCleared);
    highlighter.cursor.on('update', this.onCursorMoved);

    // Initial empty state
    this.setEmpty_();
  }

  updateQuerySets() {
    if (this.highlighter.queries.size < 1) {
      this.setEmpty_();
      return;
    }

    // Template `entity-row´ must supply an LI element skeleton
    let $elu = $('<ul/>');

    this.highlighter.queries.forEach((q, k) => {
      let $eli = this.templates.entityRow.clone();

      if (q.enabled) {
        $eli.find('enable').prop('checked', true);
      }

      $eli.find('name').text(k);
      $eli.find('count').text(q.length);
      $elu.append($eli.get());
    });

    $elu.click(ev => {
      const $node = $(ev.target);
      if ($node.data('hh-scope') === 'enable') {
        if ($node.prop('checked')) {
          this.highlighter.enable(this.getName_($node));
        } else {
          this.highlighter.disable(this.getName_($node));
        }
      }
    });

    this.nodes.entities.children().remove();
    this.nodes.entities.append($elu);
  }

  onQuerySetAdded = () => this.updateQuerySets();
  onQuerySetRemoved = () => this.updateQuerySets();
  onQuerySetEnabled = () => this.updateQuerySets();
  onQuerySetDisabled = () => this.updateQuerySets();
  onStateCleared = () => this.setEmpty_();
  onCursorCleared = () => this.updateCursor();
  onCursorMoved = () => this.updateCursor();

  updateCursor() {
    this.nodes.statsCurrent.html(
      this.highlighter.cursor.index >= 0 ? this.highlighter.cursor.index + 1 : '-'
    );
    this.nodes.statsTotal.html(this.highlighter.cursor.total);
  }

  getName_($node) {
    return $node
      .parentsUntil('ul')
      .last()
      .find('[data-hh-scope="name"]')
      .text();
  }

  setEmpty_() {
    this.nodes.entities.children().remove();
    if (this.templates.entityEmpty !== null) {
      this.nodes.entities.append(this.templates.entityEmpty.clone().get());
    }
  }
}

export default UI;
