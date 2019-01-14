import JelObject from '../JelObject';
import Callable from '../Callable';
import TypeDescriptor from './typeDescriptors/TypeDescriptor';
import TypeHelper from './typeDescriptors/TypeHelper';
import TypeChecker from './TypeChecker';
import JelBoolean from './JelBoolean';
import Context from '../Context';
import Serializer from '../Serializer';
import BaseTypeRegistry from '../BaseTypeRegistry';
import Util from '../../util/Util';


export default class StaticProperty extends JelObject {
  
  constructor(public name: string, public type: TypeDescriptor|null, public callable: Callable|null, public isNative = false) {
		super();
    if (!callable && !isNative)
      throw new Error(`Can not create property ${name}: it must either have a Callable, or be native.`);
  }
  
  getSerializationProperties(): Object {
    return [this.name, this.type, this.callable, this.isNative];
  }
  
	toString(): string {
    const prefix = this.isNative ? 'static native ' : 'static ';
    if (!this.type && !this.callable)
      return `${prefix}${this.name}`;
    if (!this.type && this.callable)
      return `${prefix}${this.name} = ${Serializer.serialize(this.callable)}`;
    else if (this.type && !this.callable)
      return `${prefix}${this.name}: ${this.type.serializeType()}`;
    else
      return `${prefix}${this.name}: ${this.type!.serializeType()} = ${Serializer.serialize(this.callable)}`;
	}

  static valueOf(name: string, type: TypeDescriptor|null, callable: Callable|null, isNative = false): StaticProperty {
    return new StaticProperty(name, type, callable, isNative);
  }
  
  static create_jel_mapping = ['name', 'type', 'callable', 'isNative', 'isStatic'];
  static create(ctx: Context, ...args: any[]) {
    return new StaticProperty(TypeChecker.realString(args[0], 'name'),  
                              TypeHelper.convertNullableFromAny(args[1], 'type'), 
                              TypeChecker.optionalInstance(Callable, args[2], 'callable', false),
                              TypeChecker.realBoolean(args[3], 'isNative', false));
  }
   
}

BaseTypeRegistry.register('StaticProperty', StaticProperty);