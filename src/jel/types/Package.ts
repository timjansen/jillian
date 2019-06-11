import PackageContent from './PackageContent';
import Class from './Class';
import TypeChecker from './TypeChecker';
import Dictionary from './Dictionary';
import List from './List';
import JelObject from '../JelObject';
import Context from '../Context';
import JelString from './JelString';
import BaseTypeRegistry from '../BaseTypeRegistry';

function createDictionary(packageName: string, content: List): Dictionary {
  const prefix = packageName + '::';
  const m = new Map<string, JelString>();
  content.elements.forEach(fn=>{
    const fullName = fn.value;
    if (fullName.length <= prefix.length || !fullName.startsWith(prefix))
      throw new Error(`Can not add element ${fullName} to package ${[packageName]}. It does not have the required prefix "${prefix}".`);
    m.set(fullName.substr(prefix.length), fn);
  });
  return new Dictionary(m, true);
}

// Defines a package of Classes and Enums
export default class Package extends PackageContent {
  public packageContent: Dictionary;
  static clazz: Class|undefined;

  /**
   * Creates a new Package.
   * @param packageName the name of the package. 
   * @param content a list of DbRefs 
   */
  constructor(packageName: string, public content: List = new List()) {
    super('Package', packageName);
    this.packageContent = createDictionary(packageName, content);
  }
  
  get clazz(): Class {
    return Package.clazz!;
  } 
  
	member(ctx: Context, name: string): JelObject|null|Promise<JelObject|null>|undefined {
    if (this.packageContent.elements.has(name))
      return ctx.get(JelString.toRealString(this.packageContent.elements.get(name) as JelString));
    return super.member(ctx, name);
	}
  
  getSerializationProperties(): any[] {
    return [this.distinctName, this.content];
  }

  static create_jel_mapping = true;
  static create(ctx: Context, ...args: any[]): Package {
    return new Package(TypeChecker.realString(args[0], 'packageName'), TypeChecker.listOfStrings(args[1], 'content'));
  }
}

const p: any = Package.prototype;
p.packageName_jel_property = true
p.content_jel_property = true;
BaseTypeRegistry.register("Package", Package);


