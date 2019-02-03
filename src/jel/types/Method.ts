import JelObject from '../JelObject';
import Callable from '../Callable';
import TypeDescriptor from './typeDescriptors/TypeDescriptor';
import TypeChecker from './TypeChecker';
import Context from '../Context';
import Serializer from '../Serializer';
import NativeJelObject from './NativeJelObject';
import Class from './Class';
import BaseTypeRegistry from '../BaseTypeRegistry';
import Util from '../../util/Util';


export default class Method extends NativeJelObject {
  
  name_jel_property: boolean;
  callable_jel_property: boolean;
  isNative_jel_property: boolean;
  isStatic_jel_property: boolean;
  isAbstract_jel_property: boolean;
  isOverride_jel_property: boolean;
  isGetter_jel_property: boolean;
  
  static clazz: Class|undefined;

  
  constructor(public name: string, public callable: Callable, public isNative = false, public isStatic = false, public isAbstract = false,
              public isOverride = false, public isGetter = false) {
		super("Method");
    
    if (!/^([a-z_][\w_]*)|((op|singleOp)([\+\-\*\/^%]|=>|===|==|<<=|>>=|>=|<=|>>|<<|>|<|!==|!=))$/.test(name)) { 
      if (/^(op|singleOp)/.test(name))
        throw new Error(`Invalid operator in operator overloading method "${name}". This operator can not be overloaded.`);
      else
        throw new Error(`Illegal method name "${name}". Method names must follow lower-case identifier rules.`);
    }
  }
   
  get clazz(): Class {
    return Method.clazz!;
  }
  
  getSerializationProperties(): any[] {
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

Method.prototype.name_jel_property = true;
Method.prototype.callable_jel_property = true;
Method.prototype.isNative_jel_property = true;
Method.prototype.isStatic_jel_property = true;
Method.prototype.isAbstract_jel_property = true;
Method.prototype.isOverride_jel_property = true;
Method.prototype.isGetter_jel_property = true;



BaseTypeRegistry.register('Method', Method);