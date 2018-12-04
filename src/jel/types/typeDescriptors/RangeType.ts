import TypeDescriptor from './TypeDescriptor';
import TypeHelper from './TypeHelper';
import Range from '../Range';
import TypeChecker from '../TypeChecker';
import {IDbRef, IDbEntry} from '../../IDatabase';
import Dictionary from '../../types/Dictionary';
import Context from '../../Context';
import JelObject from '../../JelObject';



/**
 * Declares a property type that is a range.
 */
export default class RangeType extends TypeDescriptor {
	public types: TypeDescriptor;
	
	/**
	 * types - one or more Types to define the acceptable members types of the range. 
	 */
  constructor(types: JelObject|null) {
    super();
		this.types = TypeHelper.convertFromAny(types, 'range values');
  }
  
  checkType(ctx: Context, value: JelObject|null): boolean {
    if (!(value instanceof Range))
      return false;
    if (!this.types)
      return true;
    
    return this.types.checkType(ctx, value.min) && this.types.checkType(ctx, value.max);
  }
  
  getSerializationProperties(): Object {
    return [this.types];
  }
  
  serializeType(): string {
    return this.types ? `RangeType(${this.types.serializeType()})` : `RangeType()`;
  }


  static create_jel_mapping = ['types'];
  static create(ctx: Context, ...args: any[]) {
    return new RangeType(args[0]);
  }
}




