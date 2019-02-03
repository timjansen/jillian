import JelObject from './JelObject';
import TypeDescriptor from './types/typeDescriptors/TypeDescriptor';
import TypeChecker from './types/TypeChecker';
import JelBoolean from './types/JelBoolean';
import LambdaExecutable from './LambdaExecutable';
import Context from './Context';
import Serializer from './Serializer';
import Util from '../util/Util';


export default class TypedParameterValue extends JelObject {
  
  constructor(public name: string, public type?: TypeDescriptor, public defaultValueGenerator?: LambdaExecutable) {
		super('TypedParameterValue');
    if (!/^[a-zA-Z_][\w_]*$/.test(name))
      throw new Error(`Illegal argument "${name}". Argument names must follow identifier rules.`);
  }
   
  get isNameOnly(): boolean {
    return !this.defaultValueGenerator && !this.type;
  }
  
  getSerializationProperties(): Object {
    return [this.name, this.type, this.defaultValueGenerator];
  }
    
  isNullable(ctx: Context): boolean {
    return this.type ? this.type.isNullable(ctx) : true;
  }
  
	toString(): string {
    if (this.isNameOnly)
      return this.name;
    else if (!this.type)
      return `${this.name} = ${Serializer.serialize(this.defaultValueGenerator!.expression.toString())}`;
    else if (!this.defaultValueGenerator)
      return `${this.name}: ${this.type.serializeType()}`;
    else
      return `${this.name}: ${this.type.serializeType()} = ${this.defaultValueGenerator!.expression.toString()}`;
	}

  static compatibleTypes(ctx: Context, one: TypedParameterValue|null|undefined, other: TypedParameterValue|null|undefined, canOtherBeUntyped = false): JelBoolean|Promise<JelBoolean> {
    if (!one || !other)
      return JelBoolean.valueOf((!one && !other) || (!other && canOtherBeUntyped));

    if (!one.type || !other.type)
      return JelBoolean.valueOf((!one.type && !other.type) || (!other.type && canOtherBeUntyped));
    
    return one.compatibleWith(ctx, other);
  }

  
  compatibleWith(ctx: Context, other: TypedParameterValue): JelBoolean|Promise<JelBoolean> {
    return TypeDescriptor.equals(ctx, this.type,  other.type);
  }
  
  static create_jel_mapping = ['name', 'type', 'defaultValueGenerator'];
  static create(ctx: Context, ...args: any[]) {
    return new TypedParameterValue(TypeChecker.realString(args[0], 'name'), TypeChecker.optionalInstance(TypeDescriptor, args[1], 'type'), TypeChecker.optionalInstance(LambdaExecutable, args[2], 'defaultValueGenerator'));
  }
   
}
