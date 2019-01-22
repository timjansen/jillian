import JelObject from '../JelObject';
import Callable from '../Callable';
import TypeDescriptor from './typeDescriptors/TypeDescriptor';
import TypeChecker from './TypeChecker';
import Context from '../Context';
import Serializer from '../Serializer';
import BaseTypeRegistry from '../BaseTypeRegistry';
import Util from '../../util/Util';


export default class Method extends JelObject {
  
  constructor(public name: string, public callable: Callable, public isNative = false, public isStatic = false, public isAbstract = false,
              public isOverride = false, public isGetter = false) {
		super();
  }
   
  getSerializationProperties(): Object {
    return [this.name, this.callable, this.isNative, this.isStatic, this.isAbstract, this.isOverride, this.isGetter];
  }
  
	toString(): string {
    if (this.isNative || this.isAbstract)
      return `${this.isStatic?'static ':''}${this.isAbstract?'abstract ':''}${this.isOverride?'override ':''}${this.isNative?'native ':''}${this.isGetter?'get ':''}${this.name}(${(this.callable.getArguments()||[]).map(ad=>ad.toString()).join(', ')})${this.callable.getReturnType()?': '+this.callable.getReturnType().toString():''}`;
    else
      return `${this.isStatic?'static ':''}${this.isOverride?'override ':''} ${this.isGetter?'get ':''}${this.name}${this.callable.toString()}`;
	}

  bindParentContext(ctx: Context): Method {
    return new Method(this.name, this.callable.bindParentContext(ctx), this.isNative, this.isStatic, this.isAbstract, this.isOverride, this.isGetter);
  }
  
  static valueOf(name: string, callable: Callable, isNative = false, isStatic = false, isAbstract = false, isOverride = false, isGetter = false): Method {
    return new Method(name, callable, isNative, isStatic, isAbstract, isOverride, isGetter);
  }
  
  static create_jel_mapping = ['name', 'callable', 'isNative', 'isStatic', 'isAbstract', 'isOverride', 'isGetter'];
  static create(ctx: Context, ...args: any[]) {
    return new Method(TypeChecker.realString(args[0], 'name'), 
                      TypeChecker.instance(Callable, args[1], 'callable'), 
                      TypeChecker.realBoolean(args[2], 'isNative', false),
                      TypeChecker.realBoolean(args[3], 'isStatic', false),
                      TypeChecker.realBoolean(args[4], 'isAbstract', false),
                      TypeChecker.realBoolean(args[5], 'isOverride', false),
                      TypeChecker.realBoolean(args[6], 'isGetter', false));
  }
   
}

BaseTypeRegistry.register('Method', Method);