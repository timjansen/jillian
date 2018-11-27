import TypeDescriptor from './TypeDescriptor';
import TypeHelper from './TypeHelper';
import {IDbRef} from '../../IDatabase';
import Dictionary from '../../types/Dictionary';
import List from '../../types/List';
import TypeChecker from '../../types/TypeChecker';
import Context from '../../Context';
import JelObject from '../../JelObject';


/**
 * Declares a property can have more than one value.
 */
export default class OptionType extends TypeDescriptor {
	options: List; // of TypeDescriptor
	
  constructor(options: List|TypeDescriptor|IDbRef|Dictionary) {
    super();
		this.options = new List(options instanceof List ? options.elements.map(e=>TypeHelper.convertNullableFromAny(e, 'list of property types')) : [TypeHelper.convertNullableFromAny(options, 'list of property types')]);
  }
  
  getSerializationProperties(): Object {
    return [this.options];
  }
	
  checkType(ctx: Context, value: JelObject|null): boolean {
    return this.options.hasAnyJs(option=>option ? (option as any).checkType(ctx, value) : value == null);
  }
  
  static create_jel_mapping = {options: 1};
  static create(ctx: Context, ...args: any[]) {
    const vt = args[0] instanceof List || args[0] instanceof TypeDescriptor || args[0] instanceof Dictionary ? args[0] : TypeChecker.dbRef(args[0], 'options');
    return new OptionType(vt);
  }
}




