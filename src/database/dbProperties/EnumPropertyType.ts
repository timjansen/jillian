import PropertyType from './PropertyType';
import DbRef from '../DbRef';



/**
 * Declares a property type that is an enumeration.
 */
export default class EnumPropertyType extends PropertyType {
	public definition: DbRef;
	
	/**
	 * definition - the Enum object that defines the possible values.
	 */
  constructor(definition: string | DbRef) {
    super();
		this.definition = DbRef.create(definition);
  }
  
  getSerializationProperties(): Object {
    return [this.definition];
  }

  static create_jel_mapping = {definition: 0};
  static create(...args: any[]) {
    return new EnumPropertyType(args[0]);
  }
}




