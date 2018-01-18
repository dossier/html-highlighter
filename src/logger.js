// @flow

import HtmlHighlighter from './htmlhighlighter';

export type LoggingArgs = Array<any>;

/**
 * Logging class
 *
 * Emits debug and log console output when the associated HTML Highlighter class's `debug` static
 * attribute is `true`.  Also ensures all messages contain the 'html-highlighter: ' prefix.
 */
class Logger {
  highlighter: HtmlHighlighter | null;

  init(highlighter: HtmlHighlighter): void {
    if (this.highlighter != null) {
      throw new Error('Already initialized');
    }

    this.highlighter = highlighter;
  }

  debug(...args: LoggingArgs): void {
    this.assert();
    if ((this.highlighter: any).debug) {
      this.emit('debug', args);
    }
  }

  log(...args: LoggingArgs): void {
    this.assert();
    if ((this.highlighter: any).debug) {
      this.emit('log', args);
    }
  }

  info(...args: LoggingArgs): void {
    this.emit('info', args);
  }

  warn(...args: LoggingArgs): void {
    this.emit('warn', args);
  }

  error(...args: LoggingArgs): void {
    this.emit('error', args);
  }

  exception(...args: LoggingArgs): void {
    args = this.prepend(args, 'exception occurred', 'unknown exception occurred');
    this.emit('error', args);
  }

  prepend(args: LoggingArgs, str: string, strIfEmpty: ?string): LoggingArgs {
    if (args.length === 0) {
      return [strIfEmpty || str];
    }

    const first = args[0];
    if (typeof first === 'string') {
      args[0] = `${str}: ${first}`;
    }

    return args;
  }

  emit(type: string, args: LoggingArgs): void {
    const fn = console[type];
    if (fn == null) {
      throw new Error(`Unknown \`console\` function or unavailable: ${type}`);
    }

    fn.apply(window, this.prepend(args, 'html-highlighter'));
  }

  assert(): void {
    if (this.highlighter == null) {
      throw new Error('Not initialized yet with valid HTML Highlighter instance');
    }
  }
}

export default new Logger();
