import PropertyType from './PropertyType';
import {IDbRef, IDbEntry} from '../../jel/IDatabase';
import Dictionary from '../../jel/types/Dictionary';
import TypeChecker from '../../jel/types/TypeChecker';
import Context from '../../jel/Context';


/**
 * Declares a property that is a reference to a Category. 
 */
export default class CategoryPropertyType extends PropertyType {

  constructor(public superCategory: IDbRef | null, public directChild = false) {
    super();
  }
  
  getSerializationProperties(): Object {
    return [this.superCategory, this.directChild];
  }

  static create_jel_mapping = {superCategory: 1, directChild: 2};
  static create(ctx: Context, ...args: any[]) {
    return new CategoryPropertyType(TypeChecker.optionalDbRef(args[0], 'superCategory'), TypeChecker.realBoolean(args[1], 'directChild', false));
  }
}




