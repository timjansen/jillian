import PropertyType from './PropertyType';
import Dictionary from '../../jel/types/Dictionary';
import List from '../../jel/types/List';

/**
 * Defines a complex type that has named, types fields.
 */
export default class ComplexPropertyType extends PropertyType {
  fields: Dictionary; // string->List<PropertyType>
  
  /** 
	 * dict string->PropertyType or string->List<PropertyType> . List allows you to specify more than one type.
   *      The List may also contain 'null' as element, if the value may be null.
	 */
  constructor(fields: Dictionary) {
    super();
    
    const m = new Map();
    fields.each((n, v)=>{
      m.set(n, v instanceof List ? v : new List([v]));
    });
    this.fields = new Dictionary(m);
  }
  
  getSerializationProperties(): Object {
    return {fields: this.fields};
  }

  static create_jel_mapping = {fields: 0};
  static create(...args: any[]) {
    return new ComplexPropertyType(args[0]);
  }
}




