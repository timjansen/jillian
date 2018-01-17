import {distance} from '@turf/turf';

import JelType from '../../JelType';
import DbRef from '../../../database/DbRef';
import GeoBoundaries from './GeoBoundaries';

export default abstract class GeoStructure extends JelType {
  constructor(public planet: DbRef) {
    super();
  }

  abstract getBoundaries(): GeoBoundaries;
}