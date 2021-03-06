import PackageContent from './PackageContent';
import ReferenceHelper from './ReferenceHelper';
import BaseTypeRegistry from '../BaseTypeRegistry';
import GenericJelObject from './GenericJelObject';
import Dictionary from './Dictionary';
import List from './List';
import JelString from './JelString';
import JelBoolean from './JelBoolean';
import JelObject from '../JelObject';
import Method from './Method';
import Property from './Property';
import LambdaCallable from '../LambdaCallable';
import NativeCallable from '../NativeCallable';
import TypedParameterValue from '../TypedParameterValue';
import SerializablePrimitive from '../SerializablePrimitive';
import Callable from '../Callable';
import Context from '../Context';
import Util from '../../util/Util';


// Base class for defining instantiable types
export default class Class extends PackageContent implements SerializablePrimitive {
  private classContext: Context;
  defaultPropValues: Dictionary|Promise<Dictionary>|undefined; 
  
  allProperties: Dictionary;             // name->Property, including super types, no getters
  allMethods: Dictionary;                // name->Method, all methods, including super types
  allMethodCallables: Dictionary;        // name->Callable
  allGetters: Dictionary;                // name->Method, all getters, including super types

  ctorProperties: Dictionary;              // name->Property for properties defined in the constructor
  localProperties: Dictionary;             // name->Property, including super types
  localMethods: Dictionary;                // name->Method, all methods, including super types
  localGetters: Dictionary;                // name->Method, all getters, including super types
  
  staticMethods: Dictionary;             // name->Callable

  ctorArgList: TypedParameterValue[];    // the constructor's arguments
  
  staticPropertyCache: Map<string, JelObject|null> = new Map(); // a cache for static property values
  static clazz: Class|undefined;

  
  /**
   * Creates a new Class.
   * @param name the name of the type.
   * @param superType an optional super type to inherit properties from. Its constructor will be automatically invoked.
   * @param ctor the constructor, or null if this type can not be instantiated. 
   *                              All its argument are also automatically created as properties of the type, and pre-filled
   *                              before the constructor is invoked. The constructor may set additional properties, 
   *                              defined by propertyDefs, or change the values of its own by returning a Dictionary with
   *                              property keys as keys and property values as values.
   *                              The argument 'this' is always set to null in the constructor.
   *                              The constructor can access the created class by name and read static properties that are not dynamic (not in staticContextProperties)
   */
  constructor(ctx: Context, 
              public name: string, 
              public superType?: Class, 
              public isAbstract = false, 
              public nativeClass?: any,  // ref to the class that implements native methods and, if isNative is true, is also the JelObject implementation used
              public isNative = false, 
              public ctor: LambdaCallable|NativeCallable|null = null, 
              public properties = List.empty,     // list of all Properties
              public methods = List.empty,        // list of all Methods (includes getters)
              public staticProperties = List.empty) {      
    super('Class', name);
   
    if (!/^[A-Z](?:[\w_]|\:\:[a-zA-Z])*$/.test(name))
      throw new Error(`Illegal class name "${name}". Class names must follow identifier rules and begin with a capital letter.`);
    
    this.classContext = new Context(ctx).set(name, this).freeze();
    this.ctor = ctor && ctor.bindParentContext(this.classContext);
    const reboundMethods = methods.elements.map(m=>m.bindParentContext(this.classContext));
    
    this.ctorArgList = ctor?ctor.argDefs:[];
    this.ctorProperties = new Dictionary(this.ctorArgList.map(lc=>{
      const override = superType && superType.allProperties.elements.has(lc.name);
      if (lc.type && override)
        throw new Error(`Class ${name}'s constructor is overriding ${superType!.name}'s property '${lc.name}'. It must not specify any type, as the type is inherited from the super class.`);
      return [lc.name, new Property(lc.name, lc.type, lc.defaultValueGenerator, isNative, override)];
    }));
    const getterProps = new Dictionary(reboundMethods.filter(e=>e.isGetter && !e.isStatic).map(e=>[e.name, new Property(e.name)]));
    const declaredLocalProps = new Dictionary(properties.elements.map((e: Property)=>[e.name, e]));
    const duplicateProperties = new Set(getterProps.duplicateKeysJs(declaredLocalProps).concat(getterProps.duplicateKeysJs(this.ctorProperties)).concat(this.ctorProperties.duplicateKeysJs(declaredLocalProps)));
    if (duplicateProperties.size)
      throw new Error(`One or more properties have redundant local declarations in ${name}, either as normal properties, constructor arguments or as getter: `+Array.from(duplicateProperties).join(', '));
      
    this.localProperties  = new Dictionary(this.ctorProperties).putAll(declaredLocalProps);
    this.allProperties = superType ? new Dictionary(superType.allProperties).putAll(this.localProperties) : this.localProperties;
    
    this.localMethods = new Dictionary(reboundMethods.filter(e=>!e.isStatic && !e.isGetter).map(e=>[e.name, e]));
    this.allMethods = superType ? new Dictionary(superType.allMethods).putAll(this.localMethods) : this.localMethods;
    this.staticMethods = new Dictionary(reboundMethods.filter(e=>e.isStatic && !e.isGetter).map(e=>[e.name, e]));

    this.localGetters = new Dictionary(reboundMethods.filter(e=>e.isGetter && !e.isStatic).map(e=>[e.name, e]));
    this.allGetters = superType ? new Dictionary(superType.allGetters).putAll(this.localGetters) : this.localGetters;

    if (superType) {
      if (!isAbstract) {
        const missingMethodOverride = superType.allMethods.findJs((n: string, m: Method)=>m.isAbstract && !this.localMethods.elements.has(n));
        if (missingMethodOverride)
          throw new Error(`Missing override for abstract method ${missingMethodOverride}() in ${name}. Classes need to override all abstract methods, unless they are abstract themselves.`);

        const missingPropertyOverride = superType.allProperties.findJs((n: string, p: Property)=>p.isAbstract && 
                                                                       !((this.localProperties.elements.has(n) && !(this.localProperties.elements.get(n) as any).isAbstract) || 
                                                                         (this.localGetters.elements.has(n) && !(this.localGetters.elements.get(n) as any).isAbstract)));
        if (missingPropertyOverride)
          throw new Error(`Missing override for abstract property '${missingPropertyOverride}' in ${name}. Classes need to override all abstract properties, unless they are abstract themselves.`);
      }
      
      this.ctor = (ctor instanceof LambdaCallable && superType.ctor instanceof LambdaCallable) ? ctor.bindSuper(superType.ctor) : ctor;
    }
    
    if (this.staticMethods.elements.has('create') && !isAbstract)
      throw new Error(`You must not provide the static method create() in ${name}. It is reserved for accessing the constructor.`);
  }
  
  get clazz(): Class {
    return Class.clazz!;
  }
  
  
  private has(name: string): boolean {
    return this.allProperties.elements.has(name) || this.allMethods.elements.has(name) || this.allGetters.elements.has(name);
  }
  
  protected fixPropertyOverrides(): Promise<never>|undefined {
    if (!this.superType)
      return;
     
    return Util.waitArray(this.localProperties.mapToArrayJs((name, property: Property): any=>{
      if (!this.superType!.has(name)) {
        if (property.isOverride)
          throw new Error(`Error overriding property '${name}' in ${this.name}: property not found in super type ${this.superType!.name}.`);
        return;
      }
      
      if (this.allGetters.elements.has(name))
        throw new Error(`Error overriding getter ${name}() in ${this.superType!.name} with a property in ${this.name}: you can only override getters with other getters, not with plain properties.`);

      if (this.allMethods.elements.has(name))
        throw new Error(`Error overriding method ${name}() in ${this.superType!.name} with a property in ${this.name}: you can only override methods with other methods, not with properties.`);

      const origin = this.superType!.allProperties.elements.get(name) as Property|undefined;
      
      if (!origin)
        throw new Error(`Something went wrong. Super class claims to have a member '${name}, but it's neither getter, method nor property.`);

      if (!origin.isAbstract && !this.ctorProperties.elements.has(name))
        throw new Error(`Error overriding property '${name}' in ${this.name}: you can only override 'abstract' properties.`);
      
      if (!property.isOverride)
        throw new Error(`Error overriding property '${name}' in ${this.name}: overriding property needs an 'override' modifier.`);

      if (origin.type) {
        if (property.type)
          throw new Error(`Error overriding property '${name}' in ${this.name}: overriding property must not specify a type if the super type already provided one.`);
        property.type = origin.type
      }
      return;
    }));
  }

 
  protected checkGetterOverrides(): Promise<never>|undefined {
    if (!this.superType)
      return;
     
    return Util.waitArray(this.localGetters.mapToArrayJs((name, method: Method)=>{
      if (!this.superType!.has(name)) {
        if (method.isOverride)
          throw new Error(`Error overriding getter ${name}() in ${this.name}: property not found in super type ${this.superType!.name}.`);
        return;
      }
      
      if (this.allMethods.elements.has(name))
        throw new Error(`Error overriding method ${name}() in ${this.superType!.name} with a getter in ${this.name}: you can only override methods with other methods, not with getters.`);
      
      if (!method.isOverride)
        throw new Error(`Error overriding getter ${name}() in ${this.name}: overriding getter needs an 'override' modifier.`);

      const origin = this.superType!.allGetters.elements.get(name) || this.superType!.allProperties.elements.get(name);
      const origType = origin != null ? ((origin instanceof Property) ? origin.type : ((origin as Method).callable && (origin as Method).callable!.getReturnType())) : null;
      
      const ovrdType = method.callable.getReturnType();
      if ((!!ovrdType) != (!!origType)) {
        if (ovrdType)
          throw new Error(`Error overriding property ${name} in ${this.name}: property has no type, but overriding getter has ${ovrdType.toString()}.`);
        else
          throw new Error(`Error overriding property ${name} in ${this.name}: property has return type '${origType!.toString()}', but overriding getter has no return type.`);
      }
      if (!ovrdType)
        return;
      
      return Util.resolveValue(ovrdType.compatibleWith(this.classContext, origType), (retCheck: JelBoolean)=>{
        if (!retCheck.toRealBoolean())
          throw new Error(`Error overriding getter ${name}() in ${this.name}: super type getter return type '${origType!.toString()}' is incompatible with overriding type '${ovrdType.toString()}'.`);
      });
    }));
  }


  protected checkMethodOverrides(): Promise<never>|undefined {
    if (!this.superType) {
        if (this.localMethods.findJs((n: string,m: Method)=>m.isOverride))
          throw new Error(`Class ${this.name} has overriding methods defined, but no super class.`);
      return;
    }
    
    return Util.waitArray(this.localMethods.mapToArrayJs((name, method: Method)=>{
      if (!this.superType!.has(name)) {
        if (method.isOverride)
          throw new Error(`Error overriding method ${name}() in ${this.name}: method not found in super type ${this.superType!.name}.`);
        return;
      }

      if (this.allGetters.elements.has(name))
        throw new Error(`Error overriding getter '${name}' in ${this.superType!.name} with a method of the same name in ${this.name}: you can only override getters with getters, but not with methods.`);

      if (this.allProperties.elements.has(name))
        throw new Error(`Error overriding property '${name}' in ${this.superType!.name} with a method of the same name in ${this.name}: you can only override properties with getters, but not with methods.`);
      
      if (!method.isOverride)
        throw new Error(`Error overriding method ${name}() in ${this.name}: overriding method needs an 'override' modifier.`);

      const sm = this.superType!.allMethods.elements.get(name) as Method;
      const subRet = method.callable.getReturnType();
      const superRet = sm.callable.getReturnType();
      if ((!!subRet) != (!!superRet)) {
        if (subRet)
          throw new Error(`Error overriding method ${name}() in ${this.name}: super type method has no return type, but overriding method has '${subRet.toString()}'.`);
        else
          throw new Error(`Error overriding method ${name}() in ${this.name}: super type method has return type '${superRet.toString()}', but overriding method has no return type.`);
      }

      return Util.resolveValue(subRet ? subRet.compatibleWith(this.classContext, superRet) : JelBoolean.TRUE, (retCheck: JelBoolean)=>{
        if (!retCheck.toRealBoolean())
          throw new Error(`Error overriding method ${name}() in ${this.name}: super type method return type '${superRet.toString()}' is incompatible with overriding type '${subRet.toString()}'.`);
        
        const subArgs = method.callable.getArguments();
        const superArgs = sm.callable.getArguments();
        if (!subArgs || !superArgs)
          return;
        if (subArgs.length != superArgs.length)
          throw new Error(`Error overriding method ${name}() in ${this.name}: super type method has ${superArgs.length} arguments, but this implementation has only ${subArgs.length}.`);

        return Util.resolveArray(subArgs.map((arg,i)=>arg.compatibleWith(this.classContext, superArgs[i])), (argResults: JelBoolean[])=>{
          const idx = argResults.findIndex(e=>!JelBoolean.toRealBoolean(e));
          if (idx >= 0)
            throw new Error(`Error overriding method ${name}() in ${this.name}: super class argument ${idx+1} type '${superArgs[idx].toString()}' is incompatible with overriding type '${subArgs[idx].toString()}'.`);
        });
      });
    }));
  }

  protected staticPropertyInit(): Promise<Class>|Class {
    if (this.ctor)
      this.staticPropertyCache.set('create', new NativeCallable(this, this.ctor.argDefs, this.ctor.returnType, Class.prototype.create, this.classContext, 'create'));

    this.staticPropertyCache.set('className', JelString.valueOf(this.name));
    this.staticPropertyCache.set('packageName', JelString.valueOf(this.packageName));
    this.staticPropertyCache.set('abstract', JelBoolean.valueOf(this.isAbstract));
    this.staticPropertyCache.set('superType', this.superType||null);
    this.staticPropertyCache.set('methods', this.localMethods);
    this.staticPropertyCache.set('properties', this.localProperties);
    this.staticPropertyCache.set('getters', this.localGetters);

    this.staticMethods.eachJs((name: string, m: Method) => this.staticPropertyCache.set(name, m.callable));
    
    return Util.processPromiseList(this.staticProperties.elements, (p: Property)=>{
      if (this.staticPropertyCache.has(p.name) || this.staticMethods.elements.has(p.name))
        throw new Error(`Can not overwrite static property ${p.name} in class ${this.name}. It's defined twice (possibly in a super class).`)
      if (p.isNative) {
        if (!this.nativeClass)
          throw new Error(`Can not initialize static native property ${p.name} in class ${this.name}. No native class defined.`);
        if (!this.nativeClass[p.name+'_jel_property'])
          throw new Error(`Can not access native static member ${p.name} in class ${this.name} without a valid ${p.name}_jel_property.`);
        return Util.resolveValue(BaseTypeRegistry.mapNativeTypes(this.nativeClass[p.name]), v0=>p.type ? p.type.convert(this.classContext, v0, p.name) : v0);
      }
      else if (p.defaultValueGenerator) {
        const v0 = p.defaultValueGenerator.execute(this.classContext);
        if (p.type)
          return Util.resolveValue(v0, v=>p.type!.convert(this.classContext, v, p.name));
        else
          return v0;
      }
      else
        throw new Error('Invalid static property without native or value: ' + p.name);
    }, (value: JelObject|null, p: Property)=>{
      this.staticPropertyCache.set(p.name, value);
    }, ()=>this);
  }

  member(ctx: Context, name: string): any {
    return this.staticPropertyCache.get(name);
	}
  method(ctx: Context, name: string): Callable|undefined {
    const c = this.staticPropertyCache.get(name);
    return c instanceof Callable ? c : undefined;
	}
  

  create_jel_mapping: any; // set in ctor
  create(ctx: Context, ...args: any[]): any {
    if (this.ctor instanceof NativeCallable)
      return this.ctor.invoke(this, ...args);
  
    if (this.isAbstract)
      throw new Error(`The class ${this.name} can not be instantiated. Is is declared abstract.`);
    if (!this.ctor)
      throw new Error(`The class ${this.name} can not be instantiated. No constructor defined.`);
    
    if (!this.defaultPropValues) {
      const pv = Array.from(this.allProperties.elements.values()).filter((p: Property)=>p.defaultValueGenerator != null || p.isNullable(ctx)) as Property[];
      const pc = pv.map((p: Property)=>p.defaultValueGenerator ? p.defaultValueGenerator.execute(this.classContext) : null);
      const d = new Dictionary();
      return Util.resolveArray(pc, pr=>{
        for (let i = 0; i < pv.length; i++)
          d.elements.set(pv[i].name, pr[i]);
        this.defaultPropValues = d;
        return this.create(this.classContext, ...args);
      });
    }
    else if (this.defaultPropValues instanceof Promise)
      return this.defaultPropValues.then(dpv=>{
        this.defaultPropValues = dpv;
        return this.create(ctx, ...args);
      });
    
    const props = new Dictionary(this.defaultPropValues);
    const openPropValues: (JelObject|null|Promise<JelObject|null>)[] = [];
    for (let i = 0; i < this.ctorArgList.length; i++) {
      const val = args[i] != null ? args[i] : (this.ctorArgList[i].defaultValueGenerator ? this.ctorArgList[i].defaultValueGenerator!.execute(this.classContext) : null);
      const type = this.ctorArgList[i].type;
      if (type)
        openPropValues.push(Util.resolveValue(val, v=>type.convert(this.classContext, v, this.ctorArgList[i].name)));
      else
        openPropValues.push(val);
    }
  
    return Util.resolveArray(openPropValues, resolvedPropValues => {
      for (let i = 0; i < resolvedPropValues.length; i++)
        props.elements.set(this.ctorArgList[i].name, resolvedPropValues[i]);
   
      if (this.ctor instanceof LambdaCallable) {
        return Util.resolveValue(this.ctor.invoke(this, ...args), (ctorReturn: any)=>{
          if (!(ctorReturn instanceof Dictionary))
            throw new Error(`Constructors must return a Dictionary, but the constructor of class ${this.name} did not.`);
          const ctorPropValues: any|Promise<any>[] = [];
          const ctorPropsNames = Array.from(ctorReturn.elements.keys());
          if (!ctorReturn.isEmpty) {
            for (let key of ctorPropsNames) {
              const prop: Property|undefined = this.allProperties.elements.get(key) as any;
              if (!prop)
                throw new Error(`Constructor returned property '${key}' which is not defined for class ${this.name}. All properties must be declared in the class.`);
              
              if (prop.type)
                ctorPropValues.push(prop.type.convert(this.classContext, ctorReturn.elements.get(key) || null, key));
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
            return new GenericJelObject(this, args, props);
          });
        });
      }
      else
        return new GenericJelObject(this, args, props);
    });
  }
  
  getSerializationProperties(): any[] {
    return [this.name, this.superType && new ReferenceHelper(this.superType.distinctName), this.isAbstract, this.isNative, this.ctor, this.properties, this.methods,
           this.staticProperties];
  }

  static valueOf(ctx: Context, name: string, superClass: Class, isAbstract: boolean, nativeClass: any, isNative: boolean, ctor: LambdaCallable|NativeCallable|null, properties: List,
                 methods: List, staticProperties: List): Class|Promise<Class> {
    const cl = new Class(ctx, name, superClass, isAbstract, nativeClass, isNative, ctor, properties, methods, staticProperties);
    return cl.asyncInit();
  }

  protected asyncInit(): Promise<Class>|Class {
    return Util.resolveValues(()=>this.staticPropertyInit(), this.checkMethodOverrides(), this.checkGetterOverrides(), this.fixPropertyOverrides());
  }
  
	serializeToString(pretty: boolean, indent: number, spaces: string, serializer: (object: any, pretty: boolean, indent: number, spaces: string)=>string): string {
    const preSpace = spaces.substr(0, indent*2);
    return `${preSpace}(${this.isNative?'native ':''}${this.isAbstract?'abstract ':''}class ${this.name}${this.superType?' extends '+this.superType.name:''}:\n`+
        this.staticProperties.elements.map(p=>`${preSpace}  static ${p.toString()}\n`).join('') +
        (this.staticProperties.size ? '\n':'') + 
        this.properties.elements.map(p=>`${preSpace}  ${p.toString()}\n`).join('') +
        (this.properties.size ? '\n':'') + 
        (this.ctor ? `${preSpace}  ${this.ctor instanceof NativeCallable ? 'native ':''}constructor(${(this.ctor.getArguments()||[]).map(ad=>ad.toString()).join(', ')})${this.ctor instanceof LambdaCallable?' =>\n'+preSpace+'    '+this.ctor.expression.toString()+'\n\n':''}`:'') + '\n' +
        this.methods.elements.map(m=>`${preSpace}  ${m.toString()}\n`).join('') +
        (this.methods.size ? '\n':'') + 
        ')';
  }


  static create_jel_mapping = true;
  static create(ctx: Context, ...args: any[]): Class|Promise<Class> {
    throw new Error('You can not create new classes using the constructor');
    /*
    if (TypeChecker.isIDbRef(args[1]))
      return args[1].with(ctx, (t: Class) => Class.create(ctx, args[0], t, args[2], args[3], args[4], args[5], args[6], args[7])); 
    
    return Class.valueOf(ctx, TypeChecker.realString(args[0], 'name'), 
                              TypeChecker.optionalInstance(Class, args[1], 'superType')||undefined,
                              TypeChecker.realBoolean(args[2], 'isAbstract', false),
                              null,
                              TypeChecker.realBoolean(args[3], 'isNative', false),
                              args[4] instanceof NativeCallable ? args[4] : TypeChecker.optionalInstance(LambdaCallable, args[4], 'constructor'), 
                              TypeChecker.optionalInstance(List, args[5], 'properties')||List.empty,
                              TypeChecker.optionalInstance(List, args[6], 'methods')||List.empty,
                              TypeChecker.optionalInstance(List, args[7], 'staticProperties')||List.empty);
                              */
  }
 
}

Class.prototype.create_jel_mapping = true;
BaseTypeRegistry.register('Class', Class);

