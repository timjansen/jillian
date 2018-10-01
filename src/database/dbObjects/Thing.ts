import Category from './Category';
import DbEntry from '../DbEntry';
import DbRef from '../DbRef';
import DbIndexDescriptor from '../DbIndexDescriptor';
import Dictionary from '../../jel/types/Dictionary';
import List from '../../jel/types/List';
import Serializable from '../../jel/Context';
import Context from '../../jel/Context';
import Util from '../../util/Util';


const DB_INDICES = new Map();
DB_INDICES.set('catEntries', {type: 'category', property: 'category', includeParents: true});


// Base class for any kind of physical or immaterial instance of a category
export default class Thing extends DbEntry {
  category: DbRef;
  JEL_PROPERTIES: Object;
  
  constructor(distinctName: string, category: Category|DbRef, properties: Dictionary, reality: DbRef, hashCode: string) {
    super(distinctName, reality, hashCode, properties);
    this.category = category instanceof DbRef ? category : new DbRef(category);
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
	
  getSerializationProperties(): Object {
    return {distinctName: this.distinctName, reality: this.reality, category: this.category, properties: this.properties};
  }

  static create_jel_mapping = {distinctName: 1, category: 2, properties: 3, reality: 4, hashCode: 5};
  static create(ctx: Context, ...args: any[]) {
    return new Thing(args[0], args[1], args[2], args[3], args[4]);
  }
}

Thing.prototype.JEL_PROPERTIES = {category: true};


