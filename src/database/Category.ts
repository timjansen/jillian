import DbEntry from './DbEntry';
import DbRef from './DbRef';
import DatabaseSession from './DbSession';
import DbIndexDescriptor from './DbIndexDescriptor';
import Dictionary from '../jel/types/Dictionary';
import List from '../jel/types/List';
import Context from '../jel/Context';


const DB_INDICES: Map<string, DbIndexDescriptor> = new Map();
DB_INDICES.set('subCategories', {type: 'category', property: 'superCategory', includeParents: true});

export default class Category extends DbEntry {
  superCategory: DbRef;
  JEL_PROPERTIES: Object;
  
  constructor(distinctName: string, superCategory: Category, properties = new Dictionary(), words = new Dictionary(), speech = new List(), reality: any, hashCode: string) {
    super(distinctName, reality, hashCode, properties, words, speech);
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
    return {distinctName: this.distinctName, reality: this.reality, properties: this.properties.toNullable(), words: this.words.toNullable(), speech: this.speech.toNullable(), superCategory: this.superCategory};
  }
    
  static create_jel_mapping = {distinctName: 0, superCategory: 1, properties: 2, words: 3, speech: 4, reality: 5, hashCode: 6};
  static create(...args: any[]): any {
    return new Category(args[0], args[1], args[2], args[3], args[4], args[5], args[6]);
  }
}

Category.prototype.JEL_PROPERTIES = {superCategory: true};

