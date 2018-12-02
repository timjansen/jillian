import Enum from './Enum';
import TypeDefinition from './TypeDefinition';
import DbEntry from '../DbEntry';
import DbRef from '../DbRef';
import ListType from '../../jel/types/typeDescriptors/ListType';
import OptionType from '../../jel/types/typeDescriptors/OptionType';
import SimpleType from '../../jel/types/typeDescriptors/SimpleType';
import TypeChecker from '../../jel/types/TypeChecker';
import Dictionary from '../../jel/types/Dictionary';
import List from '../../jel/types/List';
import JelObject from '../../jel/JelObject';
import Context from '../../jel/Context';
import Util from '../../util/Util';


const listTypeChecker = new ListType(new OptionType(new List([new SimpleType('Package'), new SimpleType('TypeDefinition'), new SimpleType('Enum')])));

function createDictionary(packageName: string, content: List): Dictionary {
  const prefix = packageName + '::';
  const m = new Map<string, any>();
  content.elements.forEach(e=>{
    if (e.distinctName.length <= prefix.length || !e.distinctName.startsWith(prefix))
      throw new Error(`Can not add element ${e.distinctName} to package ${[packageName]}. It does not have the required prefix "${prefix}".`);
    m.set(e.distinctName.substr(prefix.length), e);
  });
  return new Dictionary(m, true);
}

// Defines a package of TypeDefinitions and Enums
export default class Package extends DbEntry {
  JEL_PROPERTIES: Object;

  /**
   * Creates a new Package.
   * @param packageName the name of the package. 
   * @param content a list of DbRefs 
   */
  constructor(public packageName: string, public content: List = new List()) {
    super(packageName, undefined, undefined, createDictionary(packageName, content));
  }
  
	member(ctx: Context, name: string, parameters?: Map<string, JelObject|null>): JelObject|null|Promise<JelObject|null>|undefined {
    const ref: any = this.properties.elements.get(name);
    if (!ref)
      return super.member(ctx, name, parameters);
    
    if (!(ref instanceof DbRef))
      throw new Error(`Unsupported property in ${name}. Requires DbRef, but it is ${ref.getJelType()}.`);
    
		return ref.with(ctx, type=>{
      if (type instanceof TypeDefinition || type instanceof Enum || type instanceof Package)
        return type;
      else
        throw new Error(`Can not resolve package member ${name}. Package, TypeDefinition or Enum required, but it has the type ${type && type.getJelType()}.`);
    });
	}
  
  getSerializationProperties(): Object {
    return [this.packageName, this.content];
  }

  static create_jel_mapping = ['packageName', 'content'];
  static create(ctx: Context, ...args: any[]) {
    const list = TypeChecker.instance(List, args[1], 'content');
    if (!listTypeChecker.checkType(ctx, list))
      throw new Error(`Argument content must be a list of type ${listTypeChecker.serializeType()}`);
    return new Package(TypeChecker.realString(args[0], 'packageName'), list);
  }
}

Package.prototype.JEL_PROPERTIES = {packageName: true, content: true};


