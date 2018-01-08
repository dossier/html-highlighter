export const defaults = {
  // Sometimes it is useful for the client to determine how to bring an element into view via
  // scrolling. If `scrollTo` is set, then it is called as a function with a jQuery node to scroll
  // to.
  scrollTo: undefined,
  maxHighlight: 1,
  delays: {
    toggleEntities: 250,
  },
  useQueryAsClass: false,
  normalise: true,
};

export const Css = {
  highlight: "hh-highlight",
  enabled: "hh-enabled",
  disabled: "hh-disabled",
};
