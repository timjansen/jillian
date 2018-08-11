import PropertyType from './PropertyType';
import DbRef from '../DbRef';
import Dictionary from '../../jel/types/Dictionary';


/**
 * Declares a property that is a reference to a Thing. 
 */
export default class ThingPropertyType extends PropertyType {

  constructor(public category?: DbRef, public directCategory = false) {
    super();
  }
  
  getSerializationProperties(): Object {
    return [this.category, this.directCategory];
  }

  static create_jel_mapping = {category: 0, directCategory: 1};
  static create(...args: any[]) {
    return new ThingPropertyType(args[0], args[1]);
  }
}




