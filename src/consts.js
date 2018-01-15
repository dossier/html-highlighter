// @flow

export type ScrollToCallback = HTMLElement => void;

export type InputOptions = {|
  container?: HTMLElement,
  scrollTo?: ScrollToCallback | null,
  maxHighlight?: number,
  useQueryAsClass?: boolean,
  normalise?: boolean,
|};

export type Options = {|
  container: HTMLElement,
  scrollTo: ScrollToCallback | null,
  maxHighlight: number,
  useQueryAsClass: boolean,
  normalise: boolean,
|};

export const Css = {
  highlight: 'hh-highlight',
  enabled: 'hh-enabled',
  disabled: 'hh-disabled',
};
