import PropertyType from './PropertyType';
import Dictionary from '../jel/types/Dictionary';

export default class ComplexPropertyType extends PropertyType {

  // dict string->PropertyType
  constructor(public fields: Dictionary) {
    super();
  }
  
  getSerializationProperties(): Object {
    return {fields: this.fields};
  }

  static create_jel_mapping = {fields: 0};
  static create(...args: any[]) {
    return new ComplexPropertyType(args[0]);
  }
}




