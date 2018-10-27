import {distance} from '@turf/turf';

import DbRef from '../../../database/DbRef';
import GeoBoundaries from './GeoBoundaries';
import GeoStructure from './GeoStructure';
import List from '../List';

export default class GeoPolygon extends GeoStructure {
  private boundaries: GeoBoundaries|undefined;
  
  // coordinates: array of Coordinates. Automatic line from last to first.
  constructor(planet: DbRef, public coordinates: List) {
    super(planet);
  }

  getBoundaries(): GeoBoundaries {
    if (!this.boundaries) {
      const first = this.coordinates.elements[0];
      let n = first.latitude, s = first.latitude, w = first.longitude, e = first.longitude;
      for (let e of this.coordinates.elements) {
        n = Math.max(e.latitude, n);
        s = Math.min(e.latitude, s);
        e = Math.max(e.longitude, e);
        w = Math.min(e.longitude, w);
      }
      this.boundaries = new GeoBoundaries(this.planet, n, s, w, e);
    }
    return this.boundaries;
  }

}