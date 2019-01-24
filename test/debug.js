/* eslint-disable no-use-before-define */

import * as instance from './instance';

function dump() {
  const hl = instance.get();
  const { cursor, stats, lastId, queries } = hl;
  console.log('[DUMP]', { cursor, stats, lastId, queries });
}

export { dump };
