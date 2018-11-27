import TypeDescriptor from '../../jel/types/typeDescriptors/TypeDescriptor';
import {IDbRef, IDbEntry} from '../../jel/IDatabase';
import Dictionary from '../../jel/types/Dictionary';
import TypeChecker from '../../jel/types/TypeChecker';
import Context from '../../jel/Context';
import JelObject from '../../jel/JelObject';


/**
 * Declares a property that is a reference to a Category. 
 */
export default class CategoryType extends TypeDescriptor {

  constructor(public superCategory: IDbRef | null, public directChild = false) {
    super();
  }

  // note: superCategory can't be checked, since this can't be done synchronously
  checkType(ctx: Context, value: JelObject|null): boolean {
    if (value == null)
      return false;
    if ((value as any).isIDBRef)
      return (value as any).distinctName.match(/.*Category$/);
    else
      return value.getJelType() == 'Category';
  }
  
  getSerializationProperties(): Object {
    return [this.superCategory, this.directChild];
  }
  
  static create_jel_mapping = {superCategory: 1, directChild: 2};
  static create(ctx: Context, ...args: any[]) {
    return new CategoryType(TypeChecker.optionalDbRef(args[0], 'superCategory'), TypeChecker.realBoolean(args[1], 'directChild', false));
  }
}




