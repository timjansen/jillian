import {distance} from '@turf/turf';

import JelObject from '../../JelObject';
import DbRef from '../../../database/DbRef';
import GeoBoundaries from './GeoBoundaries';

export default abstract class GeoStructure extends JelObject {
  constructor(public planet: DbRef) {
    super();
  }

  abstract getBoundaries(): GeoBoundaries;
}