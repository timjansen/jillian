import BaseTypeRegistry from '../../jel/BaseTypeRegistry';
import Context from '../../jel/Context';
import JelObject from '../../jel/JelObject';
import Class from '../../jel/types/Class';
import Dictionary from '../../jel/types/Dictionary';
import JelBoolean from '../../jel/types/JelBoolean';
import List from '../../jel/types/List';
import TypeChecker from '../../jel/types/TypeChecker';
import TypeDescriptor from '../../jel/types/typeDescriptors/TypeDescriptor';
import TypeHelper from '../../jel/types/typeDescriptors/TypeHelper';
import Util from '../../util/Util';
import DbEntry from '../DbEntry';
import DbIndexDescriptor from '../DbIndexDescriptor';
import DbRef from '../DbRef';
import Category from './Category';
import MixinDefaults from './MixinDefaults';
import JelString from '../../jel/types/JelString';



const DB_INDICES = new Map();
DB_INDICES.set('catEntries', {type: 'category', property: 'category', includeParents: true});

const MAX_VALIDATION_ERRORS = 20;

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
  
  validate(ctx: Context): Promise<any>|any {
    return this.category.with(ctx, category=>
      Util.resolveValue((category as Category).allFactTypes(ctx), factTypes=>
        this.withMember(ctx, 'validateFacts', callable=>Util.resolveValue(callable.invoke(this, factTypes, JelString.valueOf(`@${category.distinctName}`)), (errors: List)=>{
          if (errors.length == 1)
            throw new Error(errors.elements[0].value);
          else if (errors.length > 1)
            throw new Error(`Found ${errors.length > MAX_VALIDATION_ERRORS ? '>'+MAX_VALIDATION_ERRORS : errors.length}} fact validation errors in @${category.distinctName}:\n${errors.elements.slice(0, MAX_VALIDATION_ERRORS).map(e=>e.value).join('\n----------\n')}`);
        else
            return true;
        }))));
  }

  getSerializationProperties(): any[] {
    // note that the default facts have been merged into facts, and do not need to be saved again
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

