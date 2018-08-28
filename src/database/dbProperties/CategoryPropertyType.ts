import PropertyType from './PropertyType';
import DbRef from '../DbRef';
import Dictionary from '../../jel/types/Dictionary';
import Context from '../../jel/Context';


/**
 * Declares a property that is a reference to a Category. 
 */
export default class CategoryPropertyType extends PropertyType {

  constructor(public superCategory?: DbRef, public directChild = false) {
    super();
  }
  
  getSerializationProperties(): Object {
    return [this.superCategory, this.directChild];
  }

  static create_jel_mapping = {superCategory: 1, directChild: 2};
  static create(ctx: Context, ...args: any[]) {
    return new CategoryPropertyType(args[0], args[1]);
  }
}




