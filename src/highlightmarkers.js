// @flow

import TextRange from './textrange';
import * as dom from './dom';
import type { QuerySet } from './typedefs';

export type Marker = {|
  query: QuerySet,
  id: number,
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

  add(query: QuerySet, id: number, hit: TextRange): void {
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
      { query, id, offset }
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

  calculateTotalVisible(queryNames: Array<string> | null): number {
    // Simple fix for now that accounts for when we're running in a JsDOM environment, under which
    // there are never any visible highlights.  This measure prevents tests from failing.
    if (!BROWSER) {
      return this.calculateTotal(queryNames);
    } else if (queryNames == null) {
      return this.markers.reduce(
        (acc, marker) => acc + Number(dom.isHighlightVisible(marker.id)),
        0
      );
    }

    return this.markers.reduce((acc, marker) => {
      if ((queryNames: any).indexOf(marker.query.name) >= 0 && dom.isHighlightVisible(marker.id)) {
        return acc + 1;
      }

      return acc;
    }, 0);
  }

  find(at: number, queryNames: Array<string> | null): Marker | null {
    let marker: Marker | null = null;

    this.markers.some(m => {
      const q = m.query;

      // Queryset must be enabled and highlight visible.  Note that highlights are never visible
      // in non-browser environments, in which case highlights are assumed to be visible.
      if (!q.enabled) {
        return false;
      } else if (queryNames != null && queryNames.indexOf(q.name) < 0) {
        return false;
      } else if (BROWSER && !dom.isHighlightVisible(m.id)) {
        return false;
      } else if (at < 1) {
        marker = m;
        return true;
      }

      --at;
      return false;
    });

    return marker;
  }

  assert(expectedSize: number): void {
    let lastOffset = 0;
    let size = 0;

    this.markers.forEach(function(i) {
      if (i.offset < lastOffset || i.id - i.query.highlightId >= i.query.length) {
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
