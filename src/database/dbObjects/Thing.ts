import Category from './Category';
import DbEntry from '../DbEntry';
import DbRef from '../DbRef';
import MixinDefaults from './MixinDefaults';
import DbIndexDescriptor from '../DbIndexDescriptor';
import Dictionary from '../../jel/types/Dictionary';
import Class from '../../jel/types/Class';
import List from '../../jel/types/List';
import JelString from '../../jel/types/JelString';
import JelBoolean from '../../jel/types/JelBoolean';
import TypeChecker from '../../jel/types/TypeChecker';
import Context from '../../jel/Context';
import Util from '../../util/Util';
import BaseTypeRegistry from '../../jel/BaseTypeRegistry';



const DB_INDICES = new Map();
DB_INDICES.set('catEntries', {type: 'category', property: 'category', includeParents: true});


// Base class for any kind of physical or immaterial instance of a category
export default class Thing extends DbEntry {
  category_jel_property: boolean;
  category: DbRef;
  static clazz: Class|undefined;

  
  constructor(distinctName: string, category: Category|DbRef, facts?: Dictionary, defaultFacts?: MixinDefaults[], reality?: DbRef, hashCode?: string) {
    super('Thing', distinctName, defaultFacts ? Dictionary.merge(defaultFacts.map(df=>df.facts)).setAllJs(facts) : facts, reality, hashCode);
    this.category = category instanceof DbRef ? category : new DbRef(category);
  }
  
  get clazz(): Class {
    return Thing.clazz!;
  }  

  
  get databaseIndices(): Map<string, DbIndexDescriptor> {
    return DB_INDICES;
  }
  
	isA_jel_mapping: Object;
	isA(ctx: Context, category: string | DbRef): JelBoolean | Promise<JelBoolean> {
		if (category instanceof DbRef)
			return this.isA(ctx, category.distinctName);
		if (this.category.distinctName == category)
			return JelBoolean.TRUE;
		return this.category.with(ctx, (c: Category) =>c.isExtending(ctx, category)) as JelBoolean | Promise<JelBoolean>;
	}
	
  getSerializationProperties(): any[] {
    return [this.distinctName, this.category, this.facts, undefined, this.reality, this.hashCode];
  }

  static create_jel_mapping = true;
  static create(ctx: Context, ...args: any[]) {
    const md = TypeChecker.optionalInstance(List, args[3], 'defaultFacts');
    const mixinDefaultsP = md ? md.elements.map((m: any)=>(m instanceof DbRef) ? m.get(ctx) : m) : [];
    
    return Util.resolveArray(mixinDefaultsP, mixinDefaults=>new Thing(TypeChecker.realString(args[0], 'distinctName'), 
                     args[1] instanceof DbRef ? args[1] : TypeChecker.instance(Category, args[1], 'category'), 
                     TypeChecker.instance(Dictionary, args[2], 'facts', Dictionary.empty), 
                     mixinDefaults, 
                     (TypeChecker.optionalDbRef(args[4], 'reality')||undefined) as any, 
                     TypeChecker.optionalRealString(args[5], 'hashCode')||undefined));
  }
}

Thing.prototype.category_jel_property = true;
Thing.prototype.isA_jel_mapping = {category: 1};

BaseTypeRegistry.register('Thing', Thing);

