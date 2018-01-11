// @flow

export type ScrollToCallback = HTMLElement => void;

export type InputOptions = {|
  container?: HTMLElement,
  scrollTo?: ScrollToCallback,
  maxHighlight?: number,
  delays?: {
    toggleEntities: number,
  },
  useQueryAsClass?: boolean,
  normalise?: boolean,
|};

export type Options = {|
  container: HTMLElement,
  scrollTo: ScrollToCallback | null,
  maxHighlight: number,
  delays: {
    toggleEntities: number,
  },
  useQueryAsClass: boolean,
  normalise: boolean,
|};

export const defaults: Options = {
  // Sometimes it is useful for the client to determine how to bring an element into view via
  // scrolling. If `scrollTo` is set, then it is called as a function with a jQuery node to scroll
  // to.
  scrollTo: null,
  maxHighlight: 1,
  delays: {
    toggleEntities: 250,
  },
  useQueryAsClass: false,
  normalise: true,
};

export const Css = {
  highlight: 'hh-highlight',
  enabled: 'hh-enabled',
  disabled: 'hh-disabled',
};

export type Stats = {|
  queries: number,
  total: number,
  highlight: number,
|};
