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
import LambdaCallable from '../LambdaCallable';
import TypedParameterValue from '../TypedParameterValue';
import IClass from '../IClass';
import Serializable from '../Serializable';
import Callable from '../Callable';
import Context from '../Context';
import StaticContext from '../StaticContext';
import Util from '../../util/Util';

class GenericJelObject extends JelObject implements Serializable {
  methodCache: Map<string, Callable> = new Map<string, Callable>();
  
  constructor(public type: Class, ctx: Context, public args: any[], public props: Dictionary) {
    super(type.className);
  }
  
  static forbidNull(value: any): JelObject|Promise<JelObject> {
    return Util.resolveValue(value, v=>{
      if (v == null)
        throw new Error("Operator implementations must not return null");
      return v;
    });
  }
  
  op(ctx: Context, operator: string, right: JelObject|null): JelObject|Promise<JelObject> {
    const callable: Callable|undefined = this.type.methods.elements.get('op'+operator) as any;
    if (callable)
      return GenericJelObject.forbidNull(callable.invoke(ctx, this, right));
    return super.op(ctx, operator, right);
  }
	
	opReversed(ctx: Context, operator: string, left: JelObject): JelObject|Promise<JelObject> {
    const callable: Callable|undefined = this.type.methods.elements.get('opReversed'+operator) as any;
    if (callable)
      return GenericJelObject.forbidNull(callable.invoke(ctx, this, left));
    return super.opReversed(ctx, operator, left);
	}
  
	singleOp(ctx: Context, operator: string): JelObject|Promise<JelObject> {
    const callable: Callable|undefined = this.type.methods.elements.get('singleOp'+operator) as any;
    if (callable)
      return GenericJelObject.forbidNull(callable.invoke(ctx, this));
    return super.singleOp(ctx, operator);
	}

	member(ctx: Context, name: string, parameters?: Map<string, JelObject|null>): JelObject|null|Promise<JelObject|null>|undefined {
    const getter = this.type.getters.elements.get(name) as Callable;
    if (getter)
      return getter.invoke(ctx, this);
    const propsValue = this.props.elements.get(name);
    if (propsValue)
      return propsValue;
    const cachedMethodValue = this.methodCache.get(name);
    if (cachedMethodValue)
      return cachedMethodValue;
    const methodValue = this.type.methods.elements.get(name);
    if (methodValue) {
      const m = (methodValue as Callable).rebind(this);
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
  ctorArgList: TypedParameterValue[]; 
  propertyTypes: Dictionary;
  propertyDefaults: Dictionary;
  staticProperties: Dictionary;

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
   * @param propertyDefs a List of TypedParameterValues of additional properties. The types defined in propertyDefs wil overwrite those set by super type and constructor.
   * @param methods a dictionary of string->function definitions for the type methods. The first argument to the functions
   *        must always 'this' and will contain a reference to the type.
   *        To define a binary operator, define a method with the name of the operator prefixed by 'op', like 'op+'.
   *         It will get two arguments 'this' and 'right'. 
   *        To define a unary operator, prefix the operator with 'singleOp'.
   *        For a reverse operator, use the prefix 'opReversed'. The arguments will be 'this' and 'left'.
   * @param getters defined getter methods for properties
   * @param staticConstantProperties static values that are simple constants. They will be stored as Class's properties.
   * @param staticContextProperties a Dictionary of Callables that set properties. The Callables are invoked, in unspecified order, after
   *         creating the Class instance and setting the staticProperties. They can access the new Class object using its name and
   *         can use it to create new instances.
   */
  constructor(public className: string, public superType?: Class, public ctor: LambdaCallable|null = null, public propertyDefs = List.empty,
               public methods = Dictionary.empty, public getters = Dictionary.empty, public staticConstantProperties = Dictionary.empty,
               public staticContextProperties = Dictionary.empty, public isAbstract = false) {
    super(className);
   
    if (/^[^A-Z]/.test(className))
      throw new Error(`Type name ${className} is not allowed: types must start with a capital letter.`);

    const uncallableMethod = methods.findJs((n: string, e: any)=>!(e instanceof Callable));
    if (uncallableMethod)
      throw new Error(`Method ${uncallableMethod} is not a Callable.`);

    const uncallableGetter = getters.findJs((n: string, e: any)=>!(e instanceof Callable));
    if (uncallableGetter)
      throw new Error(`Getter ${uncallableGetter} is not a Callable.`);

    const uncallableStaticCallable = staticContextProperties.findJs((n: string, e: any)=>!(e instanceof Callable));
    if (uncallableStaticCallable)
      throw new Error(`Static initializer for ${uncallableStaticCallable} is not a Callable.`);
    
    if (staticConstantProperties.elements.has('create'))
      throw new Error('You must not overwrite the property "create".')

    if (superType) {
      const overridenProperty = propertyDefs.elements.find((n: string)=>superType.propertyTypes.elements.has(n));
      if (overridenProperty)
        throw new Error(`Property ${overridenProperty} is already defined in super type ${superType.className}, you must not override it.`);
      
      this.ctor = ctor && ctor.bindSuper(superType.ctor);
    }

    this.ctorArgList = ctor?ctor.argDefs:[];
    const ctorProps = new Dictionary(this.ctorArgList.map(lc=>[lc.name, lc.type||AnyType.instance]));
    this.propertyTypes = new Dictionary(superType && superType.propertyTypes).putAll(ctorProps).putAll(propertyDefs.elements.map((v)=>[v.name,v.type||AnyType.instance]));
    this.propertyDefaults = new Dictionary(superType && superType.propertyDefaults).putAll(propertyDefs.elements.map((v)=>[v.name,v.defaultValue]));
    this.methods = new Dictionary(superType && superType.methods).putAll(methods);
    this.staticProperties = staticConstantProperties;

    this.create_jel_mapping = this.ctorArgList.map(lc=>lc.name);
  }

  // initialize static properties
  protected staticInit(ctx: Context): Promise<Class>|Class {
    if (this.staticContextProperties.empty)
      return this;
    const openPromises: any[] = [];
    const newProperties = new Dictionary(this.staticConstantProperties);
    const sctx = new StaticContext(ctx).set(this.className, this).freeze(true);
    this.staticContextProperties.eachJs((name: string, callable: Callable)=>{
      const v = callable.invoke(sctx, this);
      if (v instanceof Promise)
        openPromises.push(v.then(r=>newProperties.elements.set(name, r)));
      else
        newProperties.elements.set(name, v);
    });
    return Util.resolveArray(openPromises, ()=>{
      this.staticProperties = newProperties; 
      return this; 
    });
  }
  
  protected findSuperMethod(name: string): Callable | undefined {
    if (this.superType)
      return this.superType.methods.elements.get(name) as Callable || this.superType.findSuperMethod(name);
    return undefined;
  }

  protected checkMethodOverrides(ctx: Context): Promise<never>|undefined {
    if (!this.superType)
      return;
    
    return Util.waitArray(this.methods.mapToArrayJs((name, callable: Callable)=>{
      const sm = this.findSuperMethod(name);
      if (!sm)
        return;

      const subArgs = callable.getArguments();
      const superArgs = sm.getArguments();
      if (!subArgs || !superArgs)
        return;
      if (subArgs.length != superArgs.length)
        throw new Error(`Error overriding method ${name} in ${this.className}: super type method has ${superArgs.length} arguments, but this implementation has only ${subArgs.length}.`);
      
      return Util.resolveArray(subArgs.map((arg,i)=>arg.compatibleWith(ctx, superArgs[i])), (argResults: JelBoolean[])=>{
        const idx = argResults.findIndex(e=>!JelBoolean.toRealBoolean(e));
        if (idx >= 0)
          throw new Error(`Error overriding method ${name} in ${this.className}: super class argument ${idx+1} type '${superArgs[idx].toString()}' is incompatible with overriding type '${subArgs[idx].toString()}'.`);
      });
    }));
  }


  protected asyncInit(ctx: Context): Promise<Class>|Class {
    return Util.resolveValue(this.checkMethodOverrides(ctx), 
                             ()=>this.staticInit(ctx));
  }

  member(ctx: Context, name: string, parameters?: Map<string, any>): any {
		if (this.staticProperties.elements.has(name))
			return this.staticProperties.elements.get(name);
		else
      return super.member(ctx, name, parameters);
	}
  
  getSerializationProperties(): any[] {
    return [this.className, this.superType && new ReferenceHelper(this.superType.distinctName), this.ctor, this.propertyDefs, this.methods, this.getters, this.staticConstantProperties, this.staticContextProperties];
  }

  create_jel_mapping: any; // set in ctor
  create(ctx: Context, ...args: any[]): any {
    if (this.isAbstract)
      throw new Error(`The class ${this.className} can not be instantiated. Is is declared abstract.`);
    if (!this.ctor)
      throw new Error(`The class ${this.className} can not be instantiated. No constructor defined.`);
    

    const props = new Dictionary().putAll(this.propertyDefaults);
    const openChecks: (JelBoolean|Promise<JelBoolean>)[] = [];
    for (let i = 0; i < this.ctorArgList.length; i++) {
      const val = args[i]||this.ctorArgList[i].defaultValue;
      const pType: TypeDescriptor = this.propertyTypes.elements.get(this.ctorArgList[i].name) as TypeDescriptor;
      const checkResult: JelBoolean|Promise<JelBoolean> = pType.checkType(ctx, val);
      openChecks.push(checkResult);
      props.elements.set(this.ctorArgList[i].name, val);
    }
  
    return Util.resolveArray(openChecks, resolvedChecks => {
      for (let i = 0; i < resolvedChecks.length; i++)
        if (!resolvedChecks[i].toRealBoolean())
          throw new Error(`Illegal value in argument number ${i+1} for property ${this.ctorArgList[i].name}. Required type is ${this.propertyTypes.elements.get(this.ctorArgList[i].name)}. Value was ${args[i]||this.ctorArgList[i].defaultValue}.`);
   
      if (this.ctor) {
        const ctorReturnProm: any = this.ctor.invoke(ctx, this, ...args);
        
        return Util.resolveValue(ctorReturnProm, (ctorReturn: any)=>{
          if (!(ctorReturn instanceof Dictionary))
            throw new Error(`Constructors must return a Dictionary.`);
          const typePromises: Promise<any>[] = [];
          if (!ctorReturn.empty) {
            for (let key of ctorReturn.elements.keys()) {
              const type: TypeDescriptor|null|undefined = this.propertyTypes.elements.get(key) as any;
              if (!type)
                throw new Error(`Constructor returned undeclared property ${key}. All properties must be declared in the class.`);
              const checkTypeResult = type.checkType(ctx, ctorReturn.elements.get(key) || null);
              if (checkTypeResult instanceof Promise)
                typePromises.push(checkTypeResult.then((r)=>r.toRealBoolean() ? r : Promise.reject(new Error(`Constructor returned incompatible value for property ${key}. Required type is ${type.serializeType()}. Value was ${ctorReturn.elements.get(key)}.`)) as any));
              else if (!checkTypeResult.toRealBoolean())
                throw new Error(`Constructor returned incompatible value for property ${key}. Required type is ${type.serializeType()}. Value was ${ctorReturn.elements.get(key)}.`);
            }
          }
          return Util.resolveArray(typePromises, ()=>{
            props.putAll(ctorReturn);
            return new GenericJelObject(this, ctx, args, props);
          });
        });
      }
      return new GenericJelObject(this, ctx, args, props);
    });
  }
  
  static create_jel_mapping = ['className', 'superType', 'constructor', 'propertyDefs', 'methods', 'getters', 'staticValues', 'staticInitializer', 'isAbstract'];
  static create(ctx: Context, ...args: any[]): Class|Promise<Class> {
    if (TypeChecker.isIDbRef(args[1]))
      return args[1].with(ctx, (t: Class) => Class.create(ctx, args[0], t, args[2], args[3], args[4], args[5], args[6], args[7], args[8]));

    if (args[3] instanceof Dictionary)
      return Class.create(ctx, args[0], args[1], args[2], new List(args[3].mapToArrayJs((name: any, type: any)=>new TypedParameterValue(name, null, type))), args[4], args[5], args[6], args[7], args[8]);
      
    const c = new Class(TypeChecker.realString(args[0], 'className'), 
                              TypeChecker.optionalInstance(Class, args[1], 'superType')||undefined,
                              TypeChecker.optionalInstance(LambdaCallable, args[2], 'constructor'), 
                              TypeChecker.optionalInstance(List, args[3], 'propertyDefs')||List.empty,
                              TypeChecker.optionalInstance(Dictionary, args[4], 'methods')||Dictionary.empty,
                              TypeChecker.optionalInstance(Dictionary, args[5], 'getters')||Dictionary.empty,
                              TypeChecker.optionalInstance(Dictionary, args[6], 'staticValues')||Dictionary.empty,
                              TypeChecker.optionalInstance(Dictionary, args[7], 'staticInitializer')||Dictionary.empty,
                              TypeChecker.realBoolean(args[8], 'isAbstract', false));
    return c.asyncInit(ctx);
  }
}

Class.prototype.JEL_PROPERTIES = {distinctName: true, className: true, methods: true, operators: true, singleOperators: true, superType: true, getters: true, packageName: true};

BaseTypeRegistry.register('Class', Class);
BaseTypeRegistry.register('GenericJelObject', GenericJelObject);

