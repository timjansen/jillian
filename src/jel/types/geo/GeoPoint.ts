import {distance} from '@turf/turf';

import JelType from '../../JelType';
import DbRef from '../../../database/DbRef';
import GeoStructure from './GeoStructure';
import GeoBoundaries from './GeoBoundaries';

// Coordinates as urn:ogc:def:crs:OGC::CRS84
export default class GeoPoint extends GeoStructure {
  // elevation is in meter above sea level (MAMSL)
  constructor(planet: DbRef, public coordinates: Coordinates, public elevation?: number) {
    super(planet);
  }
  
  getBoundaries(): GeoBoundaries {
    return new GeoBoundaries(this.planet, this.coordinates.latitude, this.coordinates.latitude, this.coordinates.longitude, this.coordinates.longitude);
  }
}
