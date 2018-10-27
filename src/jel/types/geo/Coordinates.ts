import {distance} from '@turf/turf';

import JelObject from '../../JelObject';
import DbRef from '../../../database/DbRef';
import GeoStructure from './GeoStructure';

// Coordinates as urn:ogc:def:crs:OGC::CRS84
export default class Coordinates extends JelObject {
  constructor(public latitude: number, public longitude: number) {
    super();
  }
}