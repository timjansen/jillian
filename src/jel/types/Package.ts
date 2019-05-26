import PackageContent from './PackageContent';
import Enum from './Enum';
import Class from './Class';
import ListType from './typeDescriptors/ListType';
import OptionType from './typeDescriptors/OptionType';
import SimpleType from './typeDescriptors/SimpleType';
import TypeChecker from './TypeChecker';
import Dictionary from './Dictionary';
import JelBoolean from './JelBoolean';
import List from './List';
import JelObject from '../JelObject';
import Context from '../Context';
import Util from '../../util/Util';

const listTypeChecker = new ListType(new OptionType(new List([new SimpleType('Package'), new SimpleType('Class'), new SimpleType('Enum')])));

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

// Defines a package of Classes and Enums
export default class Package extends PackageContent {
  public packageContent: Dictionary;
  static clazz: Class|undefined;
  private packageCache: Map<string, JelObject|null|Promise<JelObject|null>>;

  /**
   * Creates a new Package.
   * @param packageName the name of the package. 
   * @param content a list of DbRefs 
   */
  constructor(packageName: string, public content: List = new List()) {
    super('Package', packageName);
    this.packageContent = createDictionary(packageName, content);
    this.packageCache = new Map();
  }
  
  get clazz(): Class {
    return Package.clazz!;
  } 
  
	member(ctx: Context, name: string): JelObject|null|Promise<JelObject|null>|undefined {
    const cached = this.packageCache.get(name);
    if (cached)
      return cached;

    const ref: any = this.packageContent.elements.get(name);
    if (!ref)
      return undefined;
    
    if (!TypeChecker.isIDbRef(ref))
      throw new Error(`Unsupported property in ${name}. Requires DbRef, but it is ${ref.className}.`);
    
		const result = ref.with(ctx, (type: any)=>{
      if (type instanceof Class || type instanceof Enum || type instanceof Package) {
        this.packageCache.set(name, type);
        return type;
      }
      else
        throw new Error(`Can not resolve package member ${name}. Package, Class or Enum required, but it has the type ${type && type.className}.`);
    });
    this.packageCache.set(name, result);
    return result;
	}
  
  getSerializationProperties(): any[] {
    return [this.distinctName, this.content];
  }

  static create_jel_mapping = ['packageName', 'content'];
  static create(ctx: Context, ...args: any[]): Package {
    const list = TypeChecker.instance(List, args[1], 'content');
    return Util.resolveValue(listTypeChecker.checkType(ctx, list), (ltc: JelBoolean)=>
      ltc.toRealBoolean() ? new Package(TypeChecker.realString(args[0], 'packageName'), list) : 
        Promise.reject(new Error(`Argument content must be a list of type ${listTypeChecker.serializeType()}`)));
  }
}

const p: any = Package.prototype;
p.packageName_jel_property = true
p.content_jel_property = true;



