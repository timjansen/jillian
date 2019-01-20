import PackageContent from './PackageContent';
import ReferenceHelper from './ReferenceHelper';
import BaseTypeRegistry from '../BaseTypeRegistry';
import TypeDescriptor from './typeDescriptors/TypeDescriptor';
import AnyType from './typeDescriptors/AnyType';
import TypeHelper from './typeDescriptors/TypeHelper';
import Dictionary from './Dictionary';
import List from './List';
import JelString from './JelString';
import JelBoolean from './JelBoolean';
import TypeChecker from './TypeChecker';
import JelObject from '../JelObject';
import Method from './Method';
import Property from './Property';
import StaticProperty from './StaticProperty';
import LambdaCallable from '../LambdaCallable';
import NativeCallable from '../NativeCallable';
import TypedParameterValue from '../TypedParameterValue';
import IClass from '../IClass';
import Serializable from '../Serializable';
import Callable from '../Callable';
import Context from '../Context';
import StaticContext from '../StaticContext';
import Util from '../../util/Util';

class GenericJelObject extends JelObject implements Serializable {
  methodCache: Map<string, Callable> = new Map<string, Callable>();
  
  constructor(clazz: Class, ctx: Context, public args: any[], public props: Dictionary) {
    super(clazz.className, clazz);
  }
  
  static forbidNull(value: any): JelObject|Promise<JelObject> {
    return Util.resolveValue(value, v=>{
      if (v == null)
        throw new Error("Operator implementations must not return null");
      return v;
    });
  }
  
  op(ctx: Context, operator: string, right: JelObject|null): JelObject|Promise<JelObject> {
    const m: Method|undefined = (this.clazz as Class).allMethods.elements.get('op'+operator) as any;
    if (m)
      return GenericJelObject.forbidNull(m.callable.invoke(ctx, this, right));
    return super.op(ctx, operator, right);
  }
	
	opReversed(ctx: Context, operator: string, left: JelObject): JelObject|Promise<JelObject> {
    const m: Method|undefined = (this.clazz as Class).allMethods.elements.get('opReversed'+operator) as any;
    if (m)
      return GenericJelObject.forbidNull(m.callable.invoke(ctx, this, left));
    return super.opReversed(ctx, operator, left);
	}
  
	singleOp(ctx: Context, operator: string): JelObject|Promise<JelObject> {
    const m: Method|undefined = (this.clazz as Class).allMethods.elements.get('singleOp'+operator) as any;
    if (m)
      return GenericJelObject.forbidNull(m.callable.invoke(ctx, this));
    return super.singleOp(ctx, operator);
	}

	member(ctx: Context, name: string, parameters?: Map<string, JelObject|null>): JelObject|null|Promise<JelObject|null>|undefined {
    const getter = (this.clazz as Class).allGetters.elements.get(name) as Method;
    if (getter)
      return getter.callable.invoke(ctx, this);
    const propsValue = this.props.elements.get(name);
    if (propsValue !== undefined)
      return propsValue;
    const cachedMethodValue = this.methodCache.get(name);
    if (cachedMethodValue)
      return cachedMethodValue;
    const method = (this.clazz as Class).allMethods.elements.get(name);
    if (method) {
      const m = (method as Method).callable.rebind(this);
      this.methodCache.set(name, m);
      return m;
    }
    return undefined;    
	}
  
  getSerializationProperties(): any[] {
    return this.args;
  }
}
GenericJelObject.prototype.reverseOps = JelObject.SWAP_OPS;



// Base class for defining instantiable types
export default class Class extends PackageContent implements IClass {
  JEL_PROPERTIES: Object;
  allProperties: Dictionary;             // name->Property, including super types, no getters
  allMethods: Dictionary;                // name->Method, all methods, including super types
  allGetters: Dictionary;                // name->Method, all getters, including super types

  localProperties: Dictionary;             // name->Property, including super types
  localMethods: Dictionary;                // name->Method, all methods, including super types
  localGetters: Dictionary;                // name->Method, all getters, including super types
  
  staticMethods: Dictionary;             // name->Callable

  ctorArgList: TypedParameterValue[];    // the constructor's arguments
  
  staticPropertyCache: Map<string, JelObject|null> = new Map(); // a cache for static property values

  
  /**
   * Creates a new Class.
   * @param className the name of the type.
   * @param superType an optional super type to inherit properties from. Its constructor will be automatically invoked.
   * @param ctor the constructor, or null if this type can not be instantiated. 
   *                              All its argument are also automatically created as properties of the type, and pre-filled
   *                              before the constructor is invoked. The constructor may set additional properties, 
   *                              defined by propertyDefs, or change the values of its own by returning a Dictionary with
   *                              property keys as keys and property values as values.
   *                              The argument 'this' is always set to null in the constructor.
   *                              The constructor can access the created class by name and read static properties that are not dynamic (not in staticContextProperties)
   */
  constructor(public className: string, public superType?: Class, 
              public isAbstract = false, 
              public nativeClass?: any,  // ref to the class that implements native methods and, if isNative is true, is also the JelObject implementation used
              public isNative = false, 
              public ctor: LambdaCallable|NativeCallable|null = null, 
              public properties = List.empty,     // list of all Properties
              public methods = List.empty,
              public staticProperties = List.empty) {      // list of all Methods (includes getters)
    super(className);
   
    if (/^[^A-Z]/.test(className))
      throw new Error(`Type name ${className} is not allowed: types must start with a capital letter.`);

    this.ctorArgList = ctor?ctor.argDefs:[];
    const ctorProps = new Dictionary(this.ctorArgList.map(lc=>[lc.name, new Property(lc.name, lc.defaultValue, lc.type||AnyType.instance)]));
    const getterProps = new Dictionary(methods.elements.filter(e=>e.isGetter && !e.isStatic).map(e=>[e.name, new Property(e.name, undefined, e.callable.getReturnType())]));
    const declaredLocalProps = new Dictionary(properties.elements.map((e: Property)=>[e.name, e]));
    const duplicateProperties = new Set(getterProps.duplicateKeysJs(declaredLocalProps).concat(getterProps.duplicateKeysJs(ctorProps)).concat(ctorProps.duplicateKeysJs(declaredLocalProps)));
    if (duplicateProperties.size)
      throw new Error('One or more properties have redundant local declarations, either as normal properties, constructor arguments or as getter: '+Array.from(duplicateProperties).join(', '));
      
    this.localProperties  = ctorProps.putAll(declaredLocalProps);
    this.allProperties = superType ? new Dictionary(superType.allProperties).putAll(this.localProperties) : this.localProperties;
    
    this.localMethods = new Dictionary(methods.elements.filter(e=>!e.isStatic && !e.isGetter).map(e=>[e.name, e]));
    this.allMethods = superType ? new Dictionary(superType.allMethods).putAll(this.localMethods) : this.localMethods;
    this.staticMethods = new Dictionary(methods.elements.filter(e=>e.isStatic && !e.isGetter).map(e=>[e.name, e]));

    this.localGetters = new Dictionary(methods.elements.filter(e=>e.isGetter && !e.isStatic).map(e=>[e.name, e]));
    this.allGetters = superType ? new Dictionary(superType.allGetters).putAll(this.localGetters) : this.localGetters;

    if (superType) {
      const overridenProperty = declaredLocalProps.findJs((n: string)=>superType.has(n));
      if (overridenProperty)
        throw new Error(`Property ${overridenProperty} is already defined in super type ${superType.className}, you must not override it.`);
      
      if (!isAbstract) {
        const missingOverride = superType.allMethods.findJs((n: string, m: Method)=>m.isAbstract && !this.localMethods.elements.has(n));
        if (missingOverride)
          throw new Error(`Missing override for abstract method ${missingOverride}(). Classes need to override all abstract methods, unless they are abstract themselves.`);
      }
      
      this.ctor = (ctor instanceof LambdaCallable && superType.ctor instanceof LambdaCallable) ? ctor.bindSuper(superType.ctor) : ctor;
    }
    
    if (this.staticMethods.elements.has('create'))
      throw new Error(`You must not provide the static method create() in ${className}. It is reserved for accessing the constructor.`);
  }
  
  private has(name: string): boolean {
    return this.allProperties.elements.has(name) || this.allMethods.elements.has(name) || this.allGetters.elements.has(name);
  }
  
  protected findMethod(name: string): Callable | undefined {
    return this.allMethods.elements.get(name) as Callable|undefined;
  }

  // finds the given property in this type including any super types. null if property exists but is untyped. Undefined if property does not exist.
  protected findProperty(name: string): TypeDescriptor | null | undefined {
    const prop = this.allProperties.elements.get(name) as Property;
    if (prop)
      return prop.type as TypeDescriptor|null;
    const getter = this.allGetters.elements.get(name) as Method|null|undefined;
    if (getter)
      return getter.callable.getReturnType() || null;
    return;
  }

  
  protected checkGetterOverrides(ctx: Context): Promise<never>|undefined {
    if (!this.superType)
      return;
    
    return Util.waitArray(this.localGetters.mapToArrayJs((name, method: Method)=>{
      if (!this.superType!.has(name)) {
        if (method.isOverride)
          throw new Error(`Error overriding getter ${name}() in ${this.className}: property not found in super type ${this.superType!.className}.`);
        return;
      }
      
      if (this.allMethods.elements.has(name))
        throw new Error(`Error overriding method ${name}() in ${this.superType!.className} with a getter in ${this.className}: you can only override methods with other methods, not with getters.`);
      
      if (!method.isOverride)
        throw new Error(`Error overriding getter ${name}() in ${this.className}: overriding getter needs an 'override' modifier.`);

      const origin = this.superType!.allGetters.elements.get(name) || this.superType!.allProperties.elements.get(name);
      const origType = origin != null ? (origin instanceof Property) ? origin.type : ((origin as StaticProperty).callable && (origin as StaticProperty).callable!.getReturnType()) : null;
      
      const ovrdType = method.callable.getReturnType();
      if ((!!ovrdType) != (!!origType)) {
        if (ovrdType)
          throw new Error(`Error overriding property ${name} in ${this.className}: property has no type, but overriding getter has ${ovrdType.toString()}.`);
        else
          throw new Error(`Error overriding property ${name} in ${this.className}: property has return type '${origType!.toString()}', but overriding getter has no return type.`);
      }
      if (!ovrdType)
        return;
      
      return Util.resolveValue(ovrdType.compatibleWith(ctx, origType), (retCheck: JelBoolean)=>{
        if (!retCheck.toRealBoolean())
          throw new Error(`Error overriding getter ${name}() in ${this.className}: super type getter return type '${origType!.toString()}' is incompatible with overriding type '${ovrdType.toString()}'.`);
      });
    }));
  }


  protected checkMethodOverrides(ctx: Context): Promise<never>|undefined {
    if (!this.superType) {
        if (this.localMethods.findJs((n: string,m: Method)=>m.isOverride))
          throw new Error(`Class ${this.className} has overriding methods defined, but no super class.`);
      return;
    }
    
    return Util.waitArray(this.localMethods.mapToArrayJs((name, method: Method)=>{
      if (!this.superType!.has(name)) {
        if (method.isOverride)
          throw new Error(`Error overriding method ${name}() in ${this.className}: method not found in super type ${this.superType!.className}.`);
        return;
      }

      if (this.allGetters.elements.has(name))
        throw new Error(`Error overriding getter '${name}' in ${this.superType!.className} with a method of the same name in ${this.className}: you can only override getters with getters, but not with methods.`);

      if (this.allProperties.elements.has(name))
        throw new Error(`Error overriding property '${name}' in ${this.superType!.className} with a method of the same name in ${this.className}: you can only override properties with getters, but not with methods.`);
      
      if (!method.isOverride)
        throw new Error(`Error overriding method ${name}() in ${this.className}: overriding method needs an 'override' modifier.`);

      const sm = this.superType!.allMethods.elements.get(name) as Method;
      const subRet = method.callable.getReturnType();
      const superRet = sm.callable.getReturnType();
      if ((!!subRet) != (!!superRet)) {
        if (subRet)
          throw new Error(`Error overriding method ${name}() in ${this.className}: super type method has no return type, but overriding method has '${subRet.toString()}'.`);
        else
          throw new Error(`Error overriding method ${name}() in ${this.className}: super type method has return type '${superRet.toString()}', but overriding method has no return type.`);
      }

      return Util.resolveValue(subRet ? subRet.compatibleWith(ctx, superRet) : JelBoolean.TRUE, (retCheck: JelBoolean)=>{
        if (!retCheck.toRealBoolean())
          throw new Error(`Error overriding method ${name}() in ${this.className}: super type method return type '${superRet.toString()}' is incompatible with overriding type '${subRet.toString()}'.`);
        
        const subArgs = method.callable.getArguments();
        const superArgs = sm.callable.getArguments();
        if (!subArgs || !superArgs)
          return;
        if (subArgs.length != superArgs.length)
          throw new Error(`Error overriding method ${name}() in ${this.className}: super type method has ${superArgs.length} arguments, but this implementation has only ${subArgs.length}.`);

        return Util.resolveArray(subArgs.map((arg,i)=>arg.compatibleWith(ctx, superArgs[i])), (argResults: JelBoolean[])=>{
          const idx = argResults.findIndex(e=>!JelBoolean.toRealBoolean(e));
          if (idx >= 0)
            throw new Error(`Error overriding method ${name}() in ${this.className}: super class argument ${idx+1} type '${superArgs[idx].toString()}' is incompatible with overriding type '${subArgs[idx].toString()}'.`);
        });
      });
    }));
  }

  protected staticPropertyInit(ctx: Context): Promise<Class>|Class {
    if (this.ctor)
      this.staticPropertyCache.set('create', new NativeCallable(this, this.ctor instanceof NativeCallable ? this.ctor.argDefs.slice(1) : this.ctor.argDefs, this.ctor.returnType, Class.prototype.create, 'create'));

    this.staticPropertyCache.set('className', JelString.valueOf(this.className));
    this.staticPropertyCache.set('packageName', JelString.valueOf(this.packageName));
    this.staticPropertyCache.set('abstract', JelBoolean.valueOf(this.isAbstract));
    this.staticPropertyCache.set('superType', this.superType||null);
    this.staticPropertyCache.set('methods', this.localMethods);
    this.staticPropertyCache.set('properties', this.localProperties);
    this.staticPropertyCache.set('getters', this.localGetters);

    this.staticMethods.eachJs((name: string, m: Method) => this.staticPropertyCache.set(name, m.callable));
    
    return Util.processPromiseList(this.staticProperties.elements, (p: StaticProperty)=>{
      if (this.staticPropertyCache.has(p.name) || this.staticMethods.elements.has(p.name))
        throw new Error(`Can not overwrite static property ${p.name} in class ${this.className}. It's defined twice (possibly in a super class).`)
      if (p.isNative) {
        if (!this.nativeClass)
          throw new Error(`Can not initialize static native property ${p.name} in class ${this.className}. No native class defined.`);
        if (!this.nativeClass[p.name+'_jel_mapping'])
          throw new Error(`Can not access native static member ${p.name} in class ${this.className} without a valid ${p.name}_jel_mapping.`);
        return Util.resolveValue(BaseTypeRegistry.mapNativeTypes(this.nativeClass[p.name]), v0=>p.type ? p.type.convert(ctx, v0, p.name) : v0);
      }
      else if (p.callable) {
        const v0 = p.callable.invoke(ctx, undefined, this);
        if (p.type)
          return Util.resolveValue(v0, v=>p.type!.convert(ctx, v, p.name));
        else
          return v0;
      }
      else
        throw new Error('Invalid static property without native or callable: ' + p.name);
    }, (value: JelObject|null, p: StaticProperty)=>{
      this.staticPropertyCache.set(p.name, value);
    }, ()=>this);
  }

  protected asyncInit(ctx: Context): Promise<Class>|Class {
    return Util.resolveValues(()=>this.staticPropertyInit(ctx), this.checkMethodOverrides(ctx), this.checkGetterOverrides(ctx));
  }

  member(ctx: Context, name: string, parameters?: Map<string, any>): any {
    return this.staticPropertyCache.get(name);
	}
  

  create_jel_mapping: any; // set in ctor
  create(ctx: Context, ...args: any[]): any {
    if (this.ctor instanceof NativeCallable) 
      return this.ctor.invoke(ctx, undefined, this, ...args);
 
    if (this.isAbstract)
      throw new Error(`The class ${this.className} can not be instantiated. Is is declared abstract.`);
    if (!this.ctor)
      throw new Error(`The class ${this.className} can not be instantiated. No constructor defined.`);
    
    const props = new Dictionary().putAll(this.allProperties.filterJs((n:string, p: Property)=>p.defaultValue != null || p.isNullable(ctx)).mapJs((n:string, p: Property)=>p.defaultValue||null));
    const openPropValues: (JelObject|null|Promise<JelObject|null>)[] = [];
    for (let i = 0; i < this.ctorArgList.length; i++) {
      const val = args[i]||this.ctorArgList[i].defaultValue||null;
      const type = this.ctorArgList[i].type;
      if (type)
        openPropValues.push(type.convert(ctx, val, this.ctorArgList[i].name));
      else
        openPropValues.push(val);
    }
  
    return Util.resolveArray(openPropValues, resolvedPropValues => {
      for (let i = 0; i < resolvedPropValues.length; i++)
        props.elements.set(this.ctorArgList[i].name, resolvedPropValues[i]);
   
      if (this.ctor instanceof LambdaCallable) {
        return Util.resolveValue(this.ctor.invoke(ctx, this, ...args), (ctorReturn: any)=>{
          if (!(ctorReturn instanceof Dictionary))
            throw new Error(`Constructors must return a Dictionary.`);
          const ctorPropValues: any|Promise<any>[] = [];
          const ctorPropsNames = Array.from(ctorReturn.elements.keys());
          if (!ctorReturn.empty) {
            for (let key of ctorPropsNames) {
              const prop: Property|undefined = this.allProperties.elements.get(key) as any;
              if (!prop)
                throw new Error(`Constructor returned undeclared property ${key}. All properties must be declared in the class.`);
              
              if (prop.type)
                ctorPropValues.push(prop.type.convert(ctx, ctorReturn.elements.get(key) || null, key));
              else
                ctorPropValues.push(ctorReturn.elements.get(key));
            }
          }
          return Util.resolveArray(ctorPropValues, (values)=>{
            for (let i = 0; i < values.length; i++)
              props.elements.set(ctorPropsNames[i], values[i]);
            
            if (props.size < this.allProperties.size)
              this.allProperties.eachJs(e=>{
                if (!props.elements.has(e))
                  throw new Error(`Property ${e} has not been defined by the constructor and has no default.`);
              });
            return new GenericJelObject(this, ctx, args, props);
          });
        });
      }
      else
        return new GenericJelObject(this, ctx, args, props);
    });
  }

  getSerializationProperties(): any[] {
    return [this.className, this.superType && new ReferenceHelper(this.superType.distinctName), this.isAbstract, this.isNative, this.ctor, this.properties, this.methods,
           this.staticProperties];
  }

  static valueOf(ctx: Context, className: string, c: Class, isAbstract: boolean, nativeClass: any, isNative: boolean, ctor: LambdaCallable|NativeCallable|null, properties: List,
                 methods: List, staticProperties: List): Class|Promise<Class> {
    const cl = new Class(className, c, isAbstract, nativeClass, isNative, ctor, properties, methods, staticProperties);
    return cl.asyncInit(ctx);
  }
  
  static create_jel_mapping = ['className', 'superType', 'isAbstract', 'isNative', 'ctor', 'properties', 'methods', 'staticProperties'];
  static create(ctx: Context, ...args: any[]): Class|Promise<Class> {
    if (TypeChecker.isIDbRef(args[1]))
      return args[1].with(ctx, (t: Class) => Class.create(ctx, args[0], t, args[2], args[3], args[4], args[5], args[6], args[7])); 
    
    return Class.valueOf(ctx, TypeChecker.realString(args[0], 'className'), 
                              TypeChecker.optionalInstance(Class, args[1], 'superType')||undefined,
                              TypeChecker.realBoolean(args[2], 'isAbstract', false),
                              null,
                              TypeChecker.realBoolean(args[3], 'isNative', false),
                              args[4] instanceof NativeCallable ? args[4] : TypeChecker.optionalInstance(LambdaCallable, args[4], 'constructor'), 
                              TypeChecker.optionalInstance(List, args[5], 'properties')||List.empty,
                              TypeChecker.optionalInstance(List, args[6], 'methods')||List.empty,
                              TypeChecker.optionalInstance(List, args[7], 'staticProperties')||List.empty);
  }
}

Class.prototype.create_jel_mapping = true;
BaseTypeRegistry.register('Class', Class);
BaseTypeRegistry.register('GenericJelObject', GenericJelObject);

