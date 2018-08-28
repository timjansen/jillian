import PropertyType from './PropertyType';
import DbRef from '../DbRef';
import Dictionary from '../../jel/types/Dictionary';


/**
 * Declares a property that just holds a single value. 
 * If the given type is a Category, only its things are allowed. 
 * If it's one of the base types, only instances of the base type.
 * If it is an enum type, only that enum is allowed.
 */
export default class SimplePropertyType extends PropertyType {

  // constants: a dictionary string->any containing fixed values for base type parameters. E.g. for @Fraction, 
	//            it could set denominator=2 .
  // types: restrictions for base type parameter in the form string->SimplePropertyType. 
	//            E.g. for @UnitValue, it could set value = @Fraction to allow only fracions as values
  // Example: SimplePropertyType(@UnitValue, {unit: @Meter}) defines a @UnitValue measuring in meters
  // Example: SimplePropertyType(@UnitValue, {unit: @Inch}, {value: SimplePropertyType(@Fraction, {denominator: 16)}) defines
  //          a unit value using 1/16th inch
  constructor(public type: DbRef, public constants: Dictionary = new Dictionary(), public types: Dictionary = new Dictionary()) {
    super();
  }
  
  getSerializationProperties(): Object {
    return [this.type, this.constants, this.types];
  }
	
  static create_jel_mapping = {type: 0, constants: 1, types: 2};
  static create(...args: any[]) {
    return new SimplePropertyType(args[0], args[1], args[2]);
  }
}




