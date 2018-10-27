import PropertyType from './PropertyType';
import PropertyHelper from './PropertyHelper';
import Dictionary from '../../jel/types/Dictionary';
import JelObject from '../../jel/JelObject';
import List from '../../jel/types/List';
import Context from '../../jel/Context';

/**
 * Defines a complex type that has named, types fields. It is represented as a dictionary in the DbEntry, but always has the same fields.
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
      m.set(n, PropertyHelper.convert(v as JelObject));
    });
    this.fields = new Dictionary(m);
  }
  
  getSerializationProperties(): Object {
    return {fields: this.fields};
  }

  static create_jel_mapping = {fields: 1};
  static create(ctx: Context, ...args: any[]) {
    return new ComplexPropertyType(args[0]);
  }
}




