import Category from './Category';
import DbEntry from '../DbEntry';
import DbRef from '../DbRef';
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

  
  constructor(distinctName: string, category: Category|DbRef, properties?: Dictionary, reality?: DbRef, hashCode?: string) {
    super('Thing', distinctName, reality || undefined, hashCode || undefined, properties || undefined);
    this.category = category instanceof DbRef ? category : new DbRef(category);
  }
  
  get clazz(): Class {
    return Thing.clazz!;
  }  

  
  get databaseIndices(): Map<string, DbIndexDescriptor> {
    return DB_INDICES;
  }
  
	member(ctx: Context, name: string, parameters?: Map<string, any>): any {
		const v = super.member(ctx, name, parameters);
		if (v === undefined)
			return Util.resolveValue(this.category.get(ctx), (c: any)=>c.instanceDefault(ctx, name, parameters));
		else
			return v;
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
    return [this.distinctName, this.category, this.properties, this.reality, this.hashCode];
  }

  static create_jel_mapping = {distinctName: 1, category: 2, properties: 3, reality: 4, hashCode: 5};
  static create(ctx: Context, ...args: any[]) {
    return new Thing(TypeChecker.realString(args[0], 'distinctName'), 
                     args[1] instanceof DbRef ? args[1] : TypeChecker.instance(Category, args[1], 'category'), 
                     TypeChecker.optionalInstance(Dictionary, args[2], 'properties')||undefined, (TypeChecker.optionalDbRef(args[3], 'reality')||undefined) as any, 
                     TypeChecker.optionalRealString(args[4], 'hashCode')||undefined);
  }
}

Thing.prototype.category_jel_property = true;
Thing.prototype.isA_jel_mapping = {category: 1};

BaseTypeRegistry.register('Thing', Thing);

