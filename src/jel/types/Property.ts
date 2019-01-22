import JelObject from '../JelObject';
import LambdaExecutable from '../LambdaExecutable';
import TypeDescriptor from './typeDescriptors/TypeDescriptor';
import TypeHelper from './typeDescriptors/TypeHelper';
import TypeChecker from './TypeChecker';
import JelBoolean from './JelBoolean';
import Context from '../Context';
import Serializer from '../Serializer';
import BaseTypeRegistry from '../BaseTypeRegistry';
import Util from '../../util/Util';


export default class Property extends JelObject {
  
  constructor(public name: string, public type?: TypeDescriptor, public defaultValueGenerator?: LambdaExecutable, public isNative = false) {
		super();
    if (!/^[a-zA-Z_][\w_]*$/.test(name))
      throw new Error(`Illegal property name "${name}". Property names must follow identifier rules.`);
  }
  
  getSerializationProperties(): Object {
    return [this.name, this.type||null, this.defaultValueGenerator||null, this.isNative];
  }
  
  isNullable(ctx: Context): boolean {
    return this.type ? this.type.isNullable(ctx) : true;
  }
  
	toString(): string {
    const prefix = this.isNative ? 'native ' : '';
    if (!this.type && !this.defaultValueGenerator)
      return `${prefix}${this.name}`;
    if (!this.type && this.defaultValueGenerator)
      return `${prefix}${this.name} = ${this.defaultValueGenerator.expression.toString()}`;
    else if (this.type && !this.defaultValueGenerator) 
      return `${prefix}${this.name}: ${this.type.serializeType()}`;
    else
      return `${prefix}${this.name}: ${this.type!.serializeType()} = ${this.defaultValueGenerator!.expression.toString()}`;
	}

  static valueOf(name: string, type?: any, defaultValueGenerator?: LambdaExecutable, isNative = false): Property {
    return new Property(name, TypeHelper.convertNullableFromAny(type, 'type') || undefined, defaultValueGenerator, isNative);
  }
  
  static create_jel_mapping = ['name', 'type', 'defaultValueGenerator', 'isNative'];
  static create(ctx: Context, ...args: any[]) {
    return new Property(TypeChecker.realString(args[0], 'name'),  
                              TypeHelper.convertNullableFromAny(args[1], 'type') || undefined, 
                              TypeChecker.optionalInstance(LambdaExecutable, args[2], 'defaultValueGenerator') || undefined,
                              TypeChecker.realBoolean(args[3], 'isNative', false));
  }
   
}

BaseTypeRegistry.register('Property', Property);