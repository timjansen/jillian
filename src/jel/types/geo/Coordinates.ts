import {distance} from '@turf/turf';

import JelType from '../../JelType';
import DbRef from '../../../database/DbRef';
import GeoStructure from './GeoStructure';

// Coordinates as urn:ogc:def:crs:OGC::CRS84
export default class Coordinates extends JelType {
  constructor(public latitude: number, public longitude: number) {
    super();
  }
}