// @flow

import EventEmitter from 'events';

import logger from './logger';
import type { Options, QuerySet } from './typedefs';
import { Css } from './consts';
import * as factory from './factory';
import RangeHighlighter from './rangehighlighter';
import RangeUnhighlighter from './rangeunhighlighter';
import TextContent from './textcontent';
import * as util from './util';

/**
 * Query set renderer abstract base class
 */
class QueryRenderer extends EventEmitter {
  querySet: ?QuerySet;
  pass: number;
  done: boolean;

  constructor() {
    super();
    this.querySet = null;
    this.pass = 0;
    this.done = false;
  }

  prerender(): ?QuerySet {
    if (this.done) {
      logger.error('query rendering already done');
      return null;
    } else if (this.pass > 0) {
      throw new Error('rendering already in progress');
    }

    // Instruct client to initialize renderer with query set.  Note that client may abort
    // rendering.
    this.emit('init');
    const q = this.querySet;
    if (this.done) {
      return null;
    } else if (q == null) {
      this.abort();
      return null;
    }

    return this.querySet;
  }

  async render(_content: TextContent): Promise<void> {
    util.abstract();
  }

  abort(): void {
    if (!this.done) {
      logger.log('aborting query render:', this.getQuerySetName());
      this.done = true;
      this.end('abort');
    }
  }

  init(querySet: QuerySet): void {
    if (!this.done && this.pass < 1) {
      this.querySet = querySet;
    }
  }

  end(event: string, ...args: Array<any>): void {
    this.emit(event, ...args);
    this.emit('end');
  }

  getQuerySetName(): string {
    return this.querySet != null ? this.querySet.name : '<unknown>';
  }
}

/**
 * Query set highlighter
 *
 * Concerned with rendering a particular query set.
 */
class QueryHighlighter extends QueryRenderer {
  queries: Array<any>;
  options: Options;
  reserve: ?number;
  deferTime: ?number;
  count: number;

  static instantiate(queries: Array<any>, renderer: Renderer): QueryHighlighter {
    return new QueryHighlighter(queries, renderer.options);
  }

  constructor(queries: Array<any>, options: Options) {
    super();

    this.queries = queries;
    this.options = options;
    this.reserve = null;
    this.deferTime = null;
    this.count = 0;
  }

  async render(content: TextContent): Promise<void> {
    const q = this.prerender();
    if (q == null) {
      return;
    }

    this.reserve = q.reserve != null && q.reserve > 0 ? q.reserve - q.length : null;

    let csscl = null;
    if (this.options.useQueryAsClass) {
      csscl = Css.highlight + '-' + q.name;
    }

    let highlighter = new RangeHighlighter(q.queryId, q.highlightId + q.length, q.enabled, csscl);

    // For each query, perform a lookup in the internal text representation and highlight each hit.
    // The global offset of each highlight is recorded by the `markers´ object.  The offset
    // is used by the `Cursor´ class to compute the next/previous highlight to show.
    for (const subject of this.queries) {
      let finder;
      try {
        finder = factory.finder(content, subject);
      } catch (x) {
        logger.exception(
          `subject finder instantiation failed [query=${q.name}]: subject:`,
          subject,
          x
        );
        return;
      }

      logger.log('processing subject:', subject);
      ++this.pass;

      let hit;
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
          this.emit('highlight', this.querySet, hit, id, subject.state);
          ++this.count;
        } catch (x) {
          logger.exception(
            `highlighting failed [query=${this.getQuerySetName()}]: subject:`,
            subject,
            x
          );
        }

        await this.wait();
      }
    }

    this.done = true;
    this.end('done', this.count);
  }

  wait(): Promise<void> {
    const { async: isAsync, interval } = this.options.rendering;
    if (!isAsync) {
      return Promise.resolve();
    }

    const deferTime = this.deferTime;
    if (deferTime != null && Date.now() < deferTime) {
      return Promise.resolve();
    }

    this.deferTime = Date.now() + interval;
    return new Promise(r => requestAnimationFrame((r: any)));
  }
}

/**
 * Query set unhighlighter
 *
 * Concerned with removing all highlights associated with a particular query set.
 */
class QueryUnhighlighter extends QueryRenderer {
  reserve: ?number;
  pass: number;
  count: number;
  done: boolean;

  static instantiate(_renderer: Renderer): QueryUnhighlighter {
    return new QueryUnhighlighter();
  }

  // TODO(mg): current algoritum is insufficient because it does not support async mechanics (see
  // QueryHighlighter::render).
  async render(_content: TextContent): Promise<void> {
    const q = this.prerender();
    if (q == null) {
      return;
    }

    ++this.pass;
    let unhighlighter = new RangeUnhighlighter();

    for (let id = q.highlightId, l = id + q.length; id < l; ++id) {
      unhighlighter.undo(id);
      this.emit('unhighlight', id);
    }

    this.done = true;
    this.end('done');
  }
}

/**
 * Master renderer component
 *
 * Responsible for managing rendering of individual query sets.
 */
class Renderer extends EventEmitter {
  options: Options;
  queue: Array<QueryRenderer>;
  active: ?QueryRenderer;
  content: ?TextContent;

  constructor(options: Options) {
    super();
    this.options = options;
    this.queue = [];
    this.active = null;
    this.content = null;

    logger.log(`async rendering mode: ${String(this.options.rendering.async)}`);
  }

  setContent(content: TextContent): void {
    this.content = content;
  }

  next(): void {
    if (this.queue.length < 1 || this.active != null || this.content == null) {
      return;
    }

    const active = (this.active = this.queue[0]);
    active.once('end', this.onNext);
    // $FlowFixMe: `content` guaranteed not `null` here
    active.render(this.content);
  }

  async wait(): Promise<void> {
    const active = this.active;
    if (active == null) {
      return;
    }

    await new Promise(resolver => this.once('done', resolver));
  }

  enqueue(renderer: QueryRenderer): void {
    const cleanup = (): void => {
      logger.log(`${renderer.constructor.name}: rendering done [${renderer.getQuerySetName()}]`);
      const idx = this.queue.indexOf(renderer);
      this.queue.splice(idx, 1);
    };

    renderer.once('end', cleanup);
    this.queue.push(renderer);
  }

  onNext = (): void => {
    this.active = null;
    this.next();

    // Signal completion of last rendering queue if not rendering anything right now.
    if (this.active == null) {
      this.emit('done');
    }
  };
}

export default Renderer;
export { QueryHighlighter, QueryUnhighlighter };
