import PropertyType from './PropertyType';
import PropertyHelper from './PropertyHelper';
import Dictionary from '../Dictionary';
import TypeChecker from '../TypeChecker';
import JelObject from '../../JelObject';
import List from '../List';
import Context from '../../Context';

/**
 * Defines a complex type that has named, typed fields. It is represented as a Dictionary in the DbEntry, but always has the same fields.
 * 
 */
export default class ComplexPropertyType extends PropertyType {
  fields: Dictionary; // string->PropertyType
  
  /** 
	 * dict string->PropertyType or DbRef or Dictionary or string->List<PropertyType or DbRef or Dictionary> . 
	 *      List allows you to specify more than one type.
   *      The List may also contain 'null' as element, if the value is optional and may be null.
	 */
  constructor(fields: Dictionary) {
    super();
    
    const m = new Map();
    fields.elements.forEach((v, n)=>{
      if ((Dictionary.empty as any)[n+'_jel_mapping'] || (Dictionary.empty.JEL_PROPERTIES as any)[n])
        throw new Error(`Illegal field name ${n}, you must not use any name that's defined in Dictionary.`);
      m.set(n, PropertyHelper.convertFromAny(v, 'dictionary value'));
    });
    this.fields = new Dictionary(m);
  }
  
  checkProperty(ctx: Context, value: JelObject|null): boolean {
    if (!(value instanceof Dictionary))
      return false;
    
    return this.fields.hasOnlyJs((k,v)=>v&&(v as any).checkProperty(ctx, value.elements.get(k)||null));
  }
  
  getSerializationProperties(): Object {
    return {fields: this.fields};
  }

  static create_jel_mapping = {fields: 1};
  static create(ctx: Context, ...args: any[]) {
    return new ComplexPropertyType(TypeChecker.instance(Dictionary, args[0], 'fields'));
  }
}




