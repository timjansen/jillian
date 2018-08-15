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
  
  constructor(distinctName: string, category: Category|DbRef, reality: DbRef, hashCode: string, properties: Dictionary) {
    super(distinctName, reality, hashCode, properties);
    this.category = DbRef.create(category);
  }
  
  get databaseIndices(): Map<string, DbIndexDescriptor> {
    return DB_INDICES;
  }
  
	member(ctx: Context, name: string, parameters?: Map<string, any>): any {
		const v = super.member(ctx, name, parameters);
		if (v === undefined)
			return Util.resolveValue((c: any)=>c.instanceDefault(ctx, name, parameters), this.category.get(ctx.dbSession));
		else
			return v;
	}
	
  getSerializationProperties(): Object {
    return {distinctName: this.distinctName, reality: this.reality, category: this.category, properties: this.properties};
  }

  static create_jel_mapping = {distinctName: 0, category: 1, reality: 2, hashCode: 3, properties: 4};
  static create(...args: any[]) {
    return new Thing(args[0], args[1], args[2], args[3], args[4]);
  }
}

Thing.prototype.JEL_PROPERTIES = {category: true};


