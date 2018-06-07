// @flow

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
