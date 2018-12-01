import TypeDescriptor from './TypeDescriptor';
import TypeHelper from './TypeHelper';
import {IDbRef, IDbEntry} from '../../IDatabase';
import Dictionary from '../Dictionary';
import List from '../List';
import TypeChecker from '../TypeChecker';
import JelObject from '../../JelObject';
import Context from '../../Context';



/**
 * Declares a property type that is a Dictionary.
 */
export default class DictionaryType extends TypeDescriptor {
	public valueTypes: TypeDescriptor|null;
	
	/**
	 * @param valueTypes one or more Types or DbRefs to define the acceptable member types for the values. 
	 *              DbRefs will be converted to SimpleTypes. Dictionary into DictionaryType.
	 *              The List may also contain 'null' as element, if values can be null.
	 */
  constructor(valueTypes: JelObject|null) {
    super();
		this.valueTypes = TypeHelper.convertFromAny(valueTypes, 'dictionary values');
  }
  
   checkType(ctx: Context, value: JelObject|null): boolean {
    if (!(value instanceof Dictionary))
      return false;
    if (!this.valueTypes)
      return true;
     
    return value.hasOnlyJs((k,v)=>this.valueTypes!.checkType(ctx, v));
  }
  
  getSerializationProperties(): Object {
    return [this.valueTypes];
  }

  serializeType(): string {
    return this.valueTypes ? `DictionaryType(${this.valueTypes.serializeType()})` : `DictionaryType()`;
  }
  
  static create_jel_mapping = {valueTypes: 1};
  static create(ctx: Context, ...args: any[]) {
    return new DictionaryType(args[0]);
  }
}




