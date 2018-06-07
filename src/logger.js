// @flow

import globals from './globals';

export type LoggingArgs = Array<any>;

/**
 * Logging class
 *
 * Emits debug and log console output when the associated HTML Highlighter class's `debug` static
 * attribute is `true`.  Also ensures all messages contain the 'html-highlighter: ' prefix.
 */
class Logger {
  debug(...args: LoggingArgs): void {
    if (globals.verbose) {
      this.emit('debug', args);
    }
  }

  log(...args: LoggingArgs): void {
    if (globals.verbose) {
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
      console.error(`logger: console function '${type}' undefined or invalid`);
    } else {
      fn.apply(console, this.prepend(args, 'html-highlighter'));
    }
  }
}

export default new Logger();
