// @flow

import EventEmitter from 'events';

import logger from './logger';
import type { Options, QuerySet } from './typedefs';
import { Css } from './consts';
import Finder from './finder';
import * as factory from './factory';
import RangeHighlighter from './rangehighlighter';
import TextContent from './textcontent';

/**
 * Query set renderer
 *
 * Concerned with rendering a particular query set.
 */
class QueryRenderer extends EventEmitter {
  querySet: QuerySet;
  queries: Array<any>;
  enabled: boolean;
  options: Options;
  state: Map<number, any>;
  reserve: ?number;
  pass: number;
  count: number;
  done: boolean;

  constructor(querySet: QuerySet, queries: Array<any>, enabled: boolean, options: Options) {
    super();

    this.querySet = querySet;
    this.queries = queries;
    this.enabled = enabled;
    this.options = options;
    this.state = new Map();
    this.reserve = null;
    this.pass = 0;
    this.count = 0;
    this.done = false;
  }

  async render(content: TextContent): Promise<void> {
    if (this.done) {
      logger.error('query rendering already done');
      return;
    } else if (this.pass > 0) {
      throw new Error('rendering already in progress');
    }

    const querySet = this.querySet;
    this.reserve =
      querySet.reserve != null && querySet.reserve > 0 ? querySet.reserve - querySet.length : null;

    let csscl = null;

    if (this.options.useQueryAsClass) {
      csscl = Css.highlight + '-' + querySet.name;
    }

    let highlighter = new RangeHighlighter(
      querySet.queryId,
      querySet.highlightId + querySet.length,
      this.enabled,
      csscl
    );

    // For each query, perform a lookup in the internal text representation and highlight each hit.
    // The global offset of each highlight is recorded by the `markers´ object.  The offset
    // is used by the `Cursor´ class to compute the next/previous highlight to show.
    for (const subject of this.queries) {
      let finder;
      try {
        finder = factory.finder(content, subject);
      } catch (x) {
        logger.exception(
          `subject finder instantiation failed [query=${querySet.name}]: subject:`,
          subject,
          x
        );
        return;
      }

      logger.log('processing subject:', subject);
      await this.begin(content, finder, highlighter, subject);
    }

    this.done = true;
    this.emit('done', this.count);
  }

  async begin(content: TextContent, finder, highlighter, subject): Promise<void> {
    return new Promise(resolve => {
      this.onRender(content, finder, highlighter, subject, resolve);
    });
  }

  onRender(
    content: TextContent,
    finder: Finder,
    highlighter: RangeHighlighter,
    subject: any,
    resolve: () => void
  ): void {
    let hit;
    const { async: isAsync, interval } = this.options.rendering;
    const deferTime = isAsync ? Date.now() + interval : 0;

    ++this.pass;
    logger.log(`rendering pass #${this.pass} [${this.querySet.name}]`);

    while ((hit = finder.next()) != null) {
      if (this.reserve != null && this.count >= this.reserve) {
        logger.error('highlight reserve exceeded');
        break;
      }

      logger.log('highlighting:', hit);

      try {
        // $FlowFixMe: `hit` cannot be `null` here as per condition in `while` above
        const id = highlighter.do(hit);

        // Notify observers of creation of new highlight
        this.emit('highlight', hit, id, subject.state);
        ++this.count;
      } catch (x) {
        logger.exception(`highlighting failed [query=${this.querySet.name}]: subject:`, subject, x);
      }

      if (isAsync && Date.now() >= deferTime) {
        requestAnimationFrame(() => this.onRender(content, finder, highlighter, subject, resolve));
        return;
      }
    }

    resolve();
  }
}

/**
 * Master renderer component
 *
 * Responsible for managing rendering of individual query sets.
 */
class Renderer extends EventEmitter {
  options: Options;
  sets: Set<string>;
  queue: Array<QueryRenderer>;
  active: ?QueryRenderer;
  content: ?TextContent;

  constructor(options: Options) {
    super();
    this.options = options;
    this.sets = new Set();
    this.queue = [];
    this.active = null;
    this.content = null;

    logger.log(`async rendering mode: ${String(this.options.rendering.async)}`);
  }

  setContent(content: TextContent): void {
    this.content = content;
  }

  async add(querySet: QuerySet, queries: Array<any>, enabled: boolean): Promise<number> {
    const name = querySet.name;
    if (this.sets.has(name)) {
      return -1;
    }

    this.sets.add(name);
    const renderer = new QueryRenderer(querySet, queries, enabled, this.options);
    this.queue.push(renderer);

    return new Promise(resolve => {
      // Simply pass event through
      renderer.on('highlight', (hit: TextRange, id: number, state: any): void => {
        this.emit('highlight', querySet, hit, id, state);
      });

      renderer.on('done', (count: number): void => {
        logger.log(`rendering done [${name}]`);
        this.sets.delete(querySet.name);
        const idx = this.queue.indexOf(renderer);
        this.queue.splice(idx, 1);
        resolve(count);
      });

      this.next();
    });
  }

  async next(): Promise<void> {
    if (this.queue.length < 1 || this.active != null || this.content == null) {
      return;
    }

    const active = (this.active = this.queue[0]);
    active.on('done', this.onRendered);
    // $FlowFixMe: `content` guaranteed not `null` here
    active.render(this.content);
  }

  onRendered = (): void => {
    this.active = null;
    this.next();
  };
}

export default Renderer;
