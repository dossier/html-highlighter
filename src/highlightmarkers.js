// @flow

import Range from './range';
import type { QuerySet } from './typedefs';

export type Marker = {|
  query: QuerySet,
  index: number,
  offset: number,
|};

/**
 * Positional highlight containment
 *
 * Manages highlights as they appear on the page rather than on the DOM to enable correct cursor
 * movement from highlight to highlight.
 */
class HighlightMarkers {
  markers: Array<Marker>;

  constructor() {
    this.markers = [];
  }

  add(query: QuerySet, index: number, hit: Range): void {
    const offset = hit.start.marker.offset + hit.start.offset;
    let mid;
    let min = 0;
    let max = this.markers.length - 1;

    while (min < max) {
      mid = Math.floor((min + max) / 2);

      if (this.markers[mid].offset < offset) {
        min = mid + 1;
      } else {
        max = mid;
      }
    }

    this.markers.splice(
      this.markers.length > 0 && this.markers[min].offset < offset ? min + 1 : min,
      0,
      { query, index, offset }
    );
  }

  removeAll(query: QuerySet): void {
    const markers = this.markers;

    for (let i = 0; i < markers.length; ) {
      if (markers[i].query === query) {
        markers.splice(i, 1);
      } else {
        ++i;
      }
    }
  }

  get(index: number): Marker | null {
    return this.markers[index] || null;
  }

  calculateTotal(queryNames: Array<string> | null): number {
    if (queryNames == null) {
      return this.markers.length;
    }

    return this.markers.reduce((acc, marker) => {
      if ((queryNames: any).indexOf(marker.query.name) >= 0) {
        return acc + 1;
      }

      return acc;
    }, 0);
  }

  findNextHighlight(fromPosition: number, queryNames: Array<string> | null): number | null {
    let ndx: number | null = null;

    this.markers.some((m, i) => {
      const q = m.query;

      if (!q.enabled) {
        return false;
      } else if (queryNames !== null && queryNames.indexOf(q.name) < 0) {
        return false;
      } else if (fromPosition === 0) {
        ndx = i;
        return true;
      }

      --fromPosition;
      return false;
    });

    return ndx;
  }

  assert(expectedSize: number): void {
    let lastOffset = 0;
    let size = 0;

    this.markers.forEach(function(i) {
      if (i.offset < lastOffset || i.index >= i.query.length) {
        throw new Error('Invalid state: highlight out of position');
      }

      lastOffset = i.offset;
      ++size;
    });

    if (size !== expectedSize) {
      throw new Error('Invalid state: size mismatch');
    }
  }
}

export default HighlightMarkers;
