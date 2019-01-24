// @flow

export type ScrollToCallback = HTMLElement => void;

export type ClientOptions = {|
  container?: HTMLElement,
  scrollTo?: ScrollToCallback | null,
  maxHighlight?: number,
  useQueryAsClass?: boolean,
  normalise?: boolean,
  rendering?: {
    async: boolean,
    interval?: number,
  },
|};

// This type is structurally the same as `ClientOptions` with the difference that all properties are
// defined.
export type Options = {|
  container: HTMLElement,
  scrollTo: ScrollToCallback | null,
  maxHighlight: number,
  useQueryAsClass: boolean,
  normalise: boolean,
  rendering: {
    async: boolean,
    interval: number,
  },
|};

export type Stats = {|
  queries: number,
  total: number,
  highlight: number,
|};

export type QuerySet = {|
  name: string,
  enabled: boolean,
  queryId: number,
  highlightId: number,
  length: number,
  reserve: number | null,
|};

export type TextSubject = string | RegExp;

export type XpathSubject = {|
  state: any,
  start: { xpath: string, offset: number },
  end: { xpath: string, offset: number },
|};

export type QuerySubject = TextSubject | XpathSubject;
