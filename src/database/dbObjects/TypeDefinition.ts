import Category from './Category';
import DbEntry from '../DbEntry';
import DbRef from '../DbRef';
import PropertyHelper from '../dbProperties/PropertyHelper';
import PropertyType from '../dbProperties/PropertyType';
import Dictionary from '../../jel/types/Dictionary';
import List from '../../jel/types/List';
import JelString from '../../jel/types/JelString';
import JelBoolean from '../../jel/types/JelBoolean';
import TypeChecker from '../../jel/types/TypeChecker';
import JelObject from '../../jel/JelObject';
import Callable from '../../jel/Callable';
import Context from '../../jel/Context';
import Util from '../../util/Util';

class GenericJelObject extends JelObject {
  props: Map<string, JelObject|null>;
  
  constructor(public type: TypeDefinition, ctx: Context, args: any[]) {
    super(type.typeName);
    
    const props: Map<string,JelObject|null> = new Map();
    for (let i = 0; i < type.ctorToProps.length; i++)
      if (type.ctorToProps[i]) {
        const val = args[i]||null;
        const pType = type.properties.elements.get(type.ctorToProps[i] as string);
        if (!(pType as PropertyType).checkProperty(ctx, val))
          throw new Error(`Illegal value in argument number ${i+1} for property ${type.ctorToProps[i]}. Required type is ${pType}.`);
        props.set(type.ctorToProps[i]!, val);
      }
    
    if (type.methods.elements.has('constructor')) {
      const ctor = type.methods.elements.get('constructor') as Callable;
      const ctorReturn: any = ctor.invoke(ctx, ...args);
      if (ctorReturn instanceof Dictionary)
        this.props = new Dictionary(props, true).putAll(ctorReturn).elements;
      else
        this.props = props;
    }
    else
      this.props = props;
  }
  
  op(ctx: Context, operator: string, right: JelObject|null): JelObject|Promise<JelObject> {
    const callable: Callable|undefined = this.type.methods.elements.get('operator'+operator) as any;
    if (callable)
      return callable.invoke(ctx, this, right);
    return super.op(ctx, operator, right);
  }
	
	opReversed(ctx: Context, operator: string, left: JelObject): JelObject|Promise<JelObject> {
    const callable: Callable|undefined = this.type.methods.elements.get('opReversed'+operator) as any;
    if (callable)
      return callable.invoke(ctx, this, left);
    return super.opReversed(ctx, operator, left);
	}
  
	singleOp(ctx: Context, operator: string): JelObject|Promise<JelObject> {
    const callable: Callable|undefined = this.type.methods.elements.get('singleOp'+operator) as any;
    if (callable)
      return callable.invoke(ctx, this);
    return super.singleOp(ctx, operator);
	}

	member(ctx: Context, name: string, parameters?: Map<string, JelObject|null>): JelObject|null|Promise<JelObject|null>|undefined {
    const propsValue = this.props.get(name);
    if (propsValue)
      return propsValue;
    const methodsValue = this.type.methods.elements.get(name);
    if (methodsValue)
      return methodsValue;
    const getter = this.type.methods.elements.get('get_'+name) as Callable;
    if (getter)
      return getter.invoke(ctx, this);
    return undefined;    
	}
}


// Base class for defining instantiable types
export default class TypeDefinition extends DbEntry {
  JEL_PROPERTIES: Object;
  ctorToProps: (string|null)[]; // list of properties to write the constructor arguments to. Will be auto-typechecked.

  /**
   * Creates a new TypeDefinition.
   * @param typeName the name of the type. The distinct name of the TypeDefinition will be this typeName with a 'Type' postfix.
   * @param constructorArgs a list of argument names for the constructor. Those that match property names will automatically be stored.
   * @param properties a dictionary string->PropertyType. Instead of property types, the usual shortcuts allowed by PropertyHelper
   *        are possible, like using a DbRef directly.
   * @param methods a dictionary of string->function definitions for the type methods. The first argument to the functions
   *        must always 'this' and will contain a reference to the type.
   *        If it contains an entry with the name 'constructor', it will be called after creation with 'this' as first argument
   *        and all constructor arguments after that. If it returns a Dictionary, these values will be used as properties.
   *        To define a binary operator, define a method with the name of the operator prefixed by 'operator', like 'operator+'.
   *         It will get two arguments 'this' and 'right'. 
   *        To define a unary operator, prefix the operator with 'singleOp'.
   *        For a reverse operator, use the prefix 'opReversed'. The arguments will be 'this' and 'left'.
   *        To define a getter, create a method with the name 'get_propertyname'. It will get 'this' as only argument.
   */
  constructor(public typeName: string, public constructorArgs: List = new List(), public properties: Dictionary = new Dictionary(), public methods: Dictionary = new Dictionary()) {
    super(typeName);
    const ctorArgs = constructorArgs.elements.map(s=>JelString.toRealString(s));
    this.create_jel_mapping = ctorArgs;
    if (properties.hasAnyJs((e: any)=>!(e instanceof PropertyType)))
      throw new Error('All properties must be defined using a property type.');
    if (methods.hasAnyJs((e: any)=>!(e instanceof Callable)))
      throw new Error('All methods must be defined using a Callable as value.');
  
    this.properties = properties.filterJs((k, v)=>PropertyHelper.convertFromAny(v, 'property definitions'));
    this.ctorToProps = ctorArgs.map(arg=>properties.elements.has(arg) ? arg : null);
  }

  
  getSerializationProperties(): Object {
    return [this.typeName, this.constructorArgs, this.properties, this.methods];
  }

  create_jel_mapping: any; // set in ctor
  create(ctx: Context, ...args: any[]) {
    return new GenericJelObject(this, ctx, args);
  }
  
  static create_jel_mapping = {typeName: 1, constructorArgs: 2, properties: 3, methods: 4};
  static create(ctx: Context, ...args: any[]) {
    return new TypeDefinition(TypeChecker.realString(args[0], 'typeName'), 
                              TypeChecker.optionalInstance(List, args[1], 'constructorArgs')||undefined, 
                              TypeChecker.optionalInstance(Dictionary, args[2], 'properties')||undefined,
                              TypeChecker.optionalInstance(Dictionary, args[3], 'methods'));
  }
}



TypeDefinition.prototype.JEL_PROPERTIES = {typeName: true, 'constructorArgs': true, properties: true, methods: true, operators: true, singleOperators: true};

