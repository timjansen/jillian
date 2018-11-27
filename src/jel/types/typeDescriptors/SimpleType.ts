import TypeDescriptor from './TypeDescriptor';
import {IDbRef} from '../../IDatabase';
import Dictionary from '../../types/Dictionary';
import TypeChecker from '../../types/TypeChecker';
import Runtime from '../../Runtime';
import Context from '../../Context';
import JelObject from '../../JelObject';


/**
 * Declares a property that just holds a single value. 
 * If the given type is a Category, only its things are allowed. 
 * If it's one of the base types, only instances of the base type.
 * If it is an enum type, only that enum is allowed.
 */
export default class SimpleType extends TypeDescriptor {

  // constants: a dictionary string->any containing fixed values for base type parameters. E.g. for @Fraction, 
	//            it could set denominator=2 .
  // types: restrictions for base type parameter in the form string->SimpleType. 
	//            E.g. for @UnitValue, it could set value = @Fraction to allow only fractions as values
  // Example: SimpleType(@UnitValue, {unit: @Meter}) defines a @UnitValue measuring in meters
  // Example: SimpleType(@UnitValue, {unit: @Inch}, {value: SimpleType(@Fraction, {denominator: 16)}) defines
  //          a unit value using 1/16th inch
  constructor(public type: IDbRef, public constants: Dictionary = Dictionary.empty, public types: Dictionary = Dictionary.empty) {
    super();
  }
  
  // note: constants and types are not checked yet. That would become async.
  checkType(ctx: Context, value: JelObject|null): boolean {
    return Runtime.instanceOf(ctx, value, this.type as any);
  }
  
  getSerializationProperties(): Object {
    return this.constants.empty && this.types.empty ? [this.type] : [this.type, this.constants, this.types];
  }
	
  static create_jel_mapping = {type: 1, constants: 2, types: 3};
  static create(ctx: Context, ...args: any[]) {
    return new SimpleType(TypeChecker.dbRef(args[0], 'type'), TypeChecker.optionalInstance(Dictionary, args[1], 'constants', Dictionary.empty), TypeChecker.optionalInstance(Dictionary, args[2], 'types', Dictionary.empty));
  }
}



