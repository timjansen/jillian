import {distance} from '@turf/turf';

import JelType from '../../JelType';
import DbRef from '../../../database/DbRef';
import GeoStructure from './GeoStructure';

export default class GeoBoundaries extends GeoStructure {
  constructor(planet: DbRef, public north: number, public south: number, public west: number, public east: number) {
    super(planet);
  }
  
  getBoundaries(): GeoBoundaries {
    return this;
  }
}