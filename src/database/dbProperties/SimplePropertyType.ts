import PropertyType from './PropertyType';
import {IDbRef} from '../../jel/IDatabase';
import Dictionary from '../../jel/types/Dictionary';
import TypeChecker from '../../jel/types/TypeChecker';
import Context from '../../jel/Context';


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
	//            E.g. for @UnitValue, it could set value = @Fraction to allow only fractions as values
  // Example: SimplePropertyType(@UnitValue, {unit: @Meter}) defines a @UnitValue measuring in meters
  // Example: SimplePropertyType(@UnitValue, {unit: @Inch}, {value: SimplePropertyType(@Fraction, {denominator: 16)}) defines
  //          a unit value using 1/16th inch
  constructor(public type: IDbRef, public constants: Dictionary = Dictionary.empty, public types: Dictionary = Dictionary.empty) {
    super();
  }
  
  getSerializationProperties(): Object {
    return [this.type, this.constants, this.types];
  }
	
  static create_jel_mapping = {type: 1, constants: 2, types: 3};
  static create(ctx: Context, ...args: any[]) {
    return new SimplePropertyType(TypeChecker.dbRef(args[0], 'type'), TypeChecker.optionalInstance(Dictionary, args[1], 'constants', Dictionary.empty), TypeChecker.optionalInstance(Dictionary, args[2], 'types', Dictionary.empty));
  }
}




