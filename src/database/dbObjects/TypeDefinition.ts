import PackageContent from './PackageContent';
import Category from './Category';
import DbEntry from '../DbEntry';
import DbRef from '../DbRef';
import TypeDescriptor from '../../jel/types/typeDescriptors/TypeDescriptor';
import AnyType from '../../jel/types/typeDescriptors/AnyType';
import TypeHelper from '../../jel/types/typeDescriptors/TypeHelper';
import Dictionary from '../../jel/types/Dictionary';
import List from '../../jel/types/List';
import JelString from '../../jel/types/JelString';
import JelBoolean from '../../jel/types/JelBoolean';
import TypeChecker from '../../jel/types/TypeChecker';
import JelObject from '../../jel/JelObject';
import LambdaCallable from '../../jel/LambdaCallable';
import LambdaArgument from '../../jel/LambdaArgument';
import ITypeDefinition from '../../jel/ITypeDefinition';
import Callable from '../../jel/Callable';
import Context from '../../jel/Context';
import Util from '../../util/Util';

class GenericJelObject extends JelObject {
  props: Dictionary;
  methodCache: Map<string, Callable> = new Map<string, Callable>();
  
  constructor(public type: TypeDefinition, ctx: Context, args: any[]) {
    super(type.typeName);
    
    this.props = new Dictionary();
    for (let i = 0; i < type.ctorArgList.length; i++) {
      const val = args[i]||type.ctorArgList[i].defaultValue;

      const pType = type.propertyDefs.elements.get(type.ctorArgList[i].name);
      if (!(pType as TypeDescriptor).checkType(ctx, val))
        throw new Error(`Illegal value in argument number ${i+1} for property ${type.ctorArgList[i].name}. Required type is ${pType}. Value was ${val}.`);
      this.props.elements.set(type.ctorArgList[i].name, val);
    }
  
    if (type.ctor) {
      const ctorReturn: any = type.ctor.invoke(ctx, this, ...args);
      if (ctorReturn instanceof Dictionary)
        this.props.putAll(ctorReturn);
    }
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
    const getter = this.type.methods.elements.get('get_'+name) as Callable;
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
}
GenericJelObject.prototype.reverseOps = Object.assign({'-':1, '/': 1, '+-': 1, '^': 1}, JelObject.SWAP_OPS);



// Base class for defining instantiable types
export default class TypeDefinition extends PackageContent implements ITypeDefinition {
  JEL_PROPERTIES: Object;
  ctorArgList: LambdaArgument[]; 

  /**
   * Creates a new TypeDefinition.
   * @param typeName the name of the type.
   * @param superType an optional super type to inherit properties from. Its constructor will be automatically invoked.
   * @param ctor the constructor, or null if this type can not be instantiated. 
   *                              All its argument are also automatically created as properties of the type, and pre-filled
   *                              before the constructor is invoked. The constructor may set additional properties, 
   *                              defined by propertyDefs, or change the values of its own by returning a Dictionary with
   *                              property keys as keys and property values as values.
   *                              The argument 'this' is supported to provide the constructor with an instance to the object, 
   *                              and will not define a property.
   * @param propertyDefs a dictionary string->TypeDescriptor of additional properties. Instead of property types, the usual shortcuts allowed by TypeHelper
   *        are possible, like using a DbRef directly. The types defined in propertyDefs wil overwrite those set by super type and constructor.
   * @param methods a dictionary of string->function definitions for the type methods. The first argument to the functions
   *        must always 'this' and will contain a reference to the type.
   *        To define a binary operator, define a method with the name of the operator prefixed by 'op', like 'op+'.
   *         It will get two arguments 'this' and 'right'. 
   *        To define a unary operator, prefix the operator with 'singleOp'.
   *        For a reverse operator, use the prefix 'opReversed'. The arguments will be 'this' and 'left'.
   *        To define a getter, create a method with the name 'get_propertyname'. It will get 'this' as only argument.
   * @param staticProperties static values and methods to be added. They will be stored as TypeDefinition's properties.
   */
  constructor(public typeName: string, public superType?: TypeDefinition, public ctor: LambdaCallable|null = null, public propertyDefs: Dictionary = new Dictionary(), public methods: Dictionary = new Dictionary(),
      staticProperties?: Dictionary) {
    super(typeName, staticProperties);

    if (/^[^A-Z]/.test(typeName))
      throw new Error(`Type name ${typeName} is not allowed: types must start with a capital letter.`);

    const uncallableMethod = methods.findJs((n: string, e: any)=>!(e instanceof Callable));
    if (uncallableMethod)
      throw new Error(`Method ${uncallableMethod} is not a Callable.`);

    if (superType) {
      const overridenProperty = propertyDefs.findJs((n: string)=>superType.propertyDefs.elements.has(n));
      if (overridenProperty)
        throw new Error(`Property ${overridenProperty} is already defined in super type ${superType.typeName}, you must not override it.`);
    }

    if (staticProperties && staticProperties.elements.has('create'))
      throw new Error('You must not overwrite the property "create".')

    this.ctorArgList = (ctor?ctor.argDefs:[]).filter(lc=>lc.name != 'this');
    const ctorProps = new Dictionary(this.ctorArgList.map(lc=>[lc.name, lc.type||AnyType.instance]));
    this.propertyDefs = new Dictionary(superType && superType.propertyDefs).putAll(ctorProps).putAll(propertyDefs.mapJs((k,v)=>TypeHelper.convertFromAny(v, `property ${k}`)));
    this.methods = new Dictionary(superType && superType.methods).putAll(methods);

    this.create_jel_mapping = this.ctorArgList.map(lc=>lc.name);
  }

  
  getSerializationProperties(): Object {
    return [this.typeName, this.superType && new DbRef(this.superType.distinctName), this.ctor, this.propertyDefs, this.methods, this.properties];
  }

  create_jel_mapping: any; // set in ctor
  create(ctx: Context, ...args: any[]) {
    if (!this.ctor)
      throw new Error(`The type ${this.typeName} can not be instantiated. No constructor defined.`);

    return new GenericJelObject(this, ctx, args);
  }
  
  static create_jel_mapping = ['typeName', 'superType', 'constructor', 'propertyDefs', 'methods', 'static'];
  static create(ctx: Context, ...args: any[]) {
    if (TypeChecker.isIDbRef(args[1]))
      return args[1].with(ctx, (t: TypeDefinition) => TypeDefinition.create(ctx, args[0], t, args[2], args[3], args[4], args[5]));

    return new TypeDefinition(TypeChecker.realString(args[0], 'typeName'), 
                              TypeChecker.optionalInstance(TypeDefinition, args[1], 'superType')||undefined,
                              TypeChecker.optionalInstance(LambdaCallable, args[2], 'constructor'), 
                              TypeChecker.optionalInstance(Dictionary, args[3], 'propertyDefs')||undefined,
                              TypeChecker.optionalInstance(Dictionary, args[4], 'methods')||undefined,
                              TypeChecker.optionalInstance(Dictionary, args[5], 'static')||undefined);
  }
}



TypeDefinition.prototype.JEL_PROPERTIES = {typeName: true, properties: true, methods: true, operators: true, singleOperators: true, superType: true, packageName: true};

