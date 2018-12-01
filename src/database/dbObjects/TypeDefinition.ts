import Category from './Category';
import DbEntry from '../DbEntry';
import DbRef from '../DbRef';
import TypeDescriptor from '../../jel/types/typeDescriptors/TypeDescriptor';
import TypeHelper from '../../jel/types/typeDescriptors/TypeHelper';
import Dictionary from '../../jel/types/Dictionary';
import List from '../../jel/types/List';
import JelString from '../../jel/types/JelString';
import JelBoolean from '../../jel/types/JelBoolean';
import TypeChecker from '../../jel/types/TypeChecker';
import JelObject from '../../jel/JelObject';
import ITypeDefinition from '../../jel/ITypeDefinition';
import Callable from '../../jel/Callable';
import Context from '../../jel/Context';
import Util from '../../util/Util';

class GenericJelObject extends JelObject {
  props: Map<string, JelObject|null>;
  methodCache: Map<string, Callable> = new Map<string, Callable>();
  
  constructor(public type: TypeDefinition, ctx: Context, args: any[]) {
    super(type.typeName);
    
    this.props = new Map<string,JelObject|null>();
    for (let i = 0; i < type.ctorToProps.length; i++)
      if (type.ctorToProps[i]) {
        const val = args[i]||null;
        const pType = type.propertyDefs.elements.get(type.ctorToProps[i] as string);
        if (!(pType as TypeDescriptor).checkType(ctx, val))
          throw new Error(`Illegal value in argument number ${i+1} for property ${type.ctorToProps[i]}. Required type is ${pType}. Value was ${val}.`);
        this.props.set(type.ctorToProps[i]!, val);
      }
    
    if (type.methods.elements.has('constructor')) {
      const ctor = type.methods.elements.get('constructor') as Callable;
      const ctorReturn: any = ctor.invoke(ctx, this, ...args);
      if (ctorReturn instanceof Dictionary)
        this.props = new Dictionary(this.props, true).putAll(ctorReturn).elements;
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
    const propsValue = this.props.get(name);
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
export default class TypeDefinition extends DbEntry implements ITypeDefinition {
  JEL_PROPERTIES: Object;
  ctorToProps: (string|null)[]; // list of properties to write the constructor arguments to. Will be auto-typechecked.

  /**
   * Creates a new TypeDefinition.
   * @param typeName the name of the type. The distinct name of the TypeDefinition will be this typeName with a 'Type' postfix.
   * @param constructorArgs a list of argument names for the constructor. Those that match property names will automatically be stored.
   * @param propertyDefs a dictionary string->Type. Instead of property types, the usual shortcuts allowed by TypeHelper
   *        are possible, like using a DbRef directly.
   * @param methods a dictionary of string->function definitions for the type methods. The first argument to the functions
   *        must always 'this' and will contain a reference to the type.
   *        If it contains an entry with the name 'constructor', it will be called after creation with 'this' as first argument
   *        and all constructor arguments after that. If it returns a Dictionary, these values will be used as properties.
   *        To define a binary operator, define a method with the name of the operator prefixed by 'op', like 'op+'.
   *         It will get two arguments 'this' and 'right'. 
   *        To define a unary operator, prefix the operator with 'singleOp'.
   *        For a reverse operator, use the prefix 'opReversed'. The arguments will be 'this' and 'left'.
   *        To define a getter, create a method with the name 'get_propertyname'. It will get 'this' as only argument.
   * @param staticProperties static values and methods to be added. They will be stored as TypeDefinition's properties.
   */
  constructor(public typeName: string, public constructorArgs: List = new List(), public propertyDefs: Dictionary = new Dictionary(), public methods: Dictionary = new Dictionary(),
      staticProperties?: Dictionary) {
    super(typeName, undefined, undefined, staticProperties);
    const ctorArgs = constructorArgs.elements.map(s=>JelString.toRealString(s));
    this.create_jel_mapping = ctorArgs;
    this.propertyDefs = propertyDefs.mapJs((k,v)=>TypeHelper.convertFromAny(v, 'properties definitions'));
    if (methods.hasAnyJs((n: string, e: any)=>!(e instanceof Callable)))
      throw new Error('All methods must be defined using a Callable as value.');
  
    this.propertyDefs = propertyDefs.filterJs((k, v)=>TypeHelper.convertFromAny(v, 'property definitions'));
    this.ctorToProps = ctorArgs.map(arg=>propertyDefs.elements.has(arg) ? arg : null);
  
    if (staticProperties && staticProperties.elements.has('create'))
      throw new Error('You must not overwrite the property "create".')
  }

  
  getSerializationProperties(): Object {
    return [this.typeName, this.constructorArgs, this.propertyDefs, this.methods, this.properties];
  }

  create_jel_mapping: any; // set in ctor
  create(ctx: Context, ...args: any[]) {
    return new GenericJelObject(this, ctx, args);
  }
  
  static create_jel_mapping = {typeName: 1, constructorArgs: 2, propertyDefs: 3, methods: 4, static: 5};
  static create(ctx: Context, ...args: any[]) {
    return new TypeDefinition(TypeChecker.realString(args[0], 'typeName'), 
                              TypeChecker.optionalInstance(List, args[1], 'constructorArgs')||undefined, 
                              TypeChecker.optionalInstance(Dictionary, args[2], 'propertyDefs')||undefined,
                              TypeChecker.optionalInstance(Dictionary, args[3], 'methods')||undefined,
                              TypeChecker.optionalInstance(Dictionary, args[4], 'static')||undefined);
  }
}



TypeDefinition.prototype.JEL_PROPERTIES = {typeName: true, 'constructorArgs': true, properties: true, methods: true, operators: true, singleOperators: true};

