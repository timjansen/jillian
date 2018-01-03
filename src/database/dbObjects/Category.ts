import DbEntry from '../DbEntry';
import DbRef from '../DbRef';
import DatabaseSession from '../DbSession';
import DbIndexDescriptor from '../DbIndexDescriptor';
import Dictionary from '../../jel/types/Dictionary';
import List from '../../jel/types/List';
import Context from '../../jel/Context';


const DB_INDICES: Map<string, DbIndexDescriptor> = new Map();
DB_INDICES.set('subCategories', {type: 'category', property: 'superCategory', includeParents: true});

export default class Category extends DbEntry {
  superCategory: DbRef;
  JEL_PROPERTIES: Object;
  
  constructor(distinctName: string, superCategory: Category|DbRef, reality?: any, hashCode?: string) {
    super(distinctName, reality, hashCode);
    this.superCategory = DbRef.create(superCategory); 
  }

  // returns promise with all matching objects
  getInstances(ctx: Context, filterFunc: (o: DbEntry)=>boolean): Promise<Category[]> {
    return DbRef.getSession(ctx).getByIndex(this, 'catEntries', filterFunc) as Promise<Category[]>;
  }

  get databaseIndices(): Map<string, DbIndexDescriptor> {
    return DB_INDICES;
  }
  
  getSerializationProperties(): Object {
    return {distinctName: this.distinctName, reality: this.reality, superCategory: this.superCategory};
  }
    
  static create_jel_mapping = {distinctName: 0, superCategory: 1, reality: 2, hashCode: 3};
  static create(...args: any[]): any {
    return new Category(args[0], args[1], args[2], args[3]);
  }
}

Category.prototype.JEL_PROPERTIES = {superCategory: true};

