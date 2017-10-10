import Category from './Category';
import DbEntry from './DbEntry';
import DbRef from './DbRef';
import DbIndexDescriptor from './DbIndexDescriptor';
import Dictionary from '../jel/Dictionary';
import List from '../jel/List';

const DB_INDICES = new Map();
DB_INDICES.set('catEntries', {type: 'category', property: 'category', includeParents: true});


// Base class for any kind of physical or immaterial instance of a category
export default class Thing extends DbEntry {
  category: DbRef;
  JEL_PROPERTIES: Object;
  
  constructor(distinctName: string, category: Category, properties = new Dictionary(), words = new Dictionary(), speech = new List(), reality: any, hashCode: string) {
    super(distinctName, reality, hashCode, properties, words);
    this.category = DbRef.create(category);
  }
  
  get databaseIndices(): Map<string, DbIndexDescriptor> {
    return DB_INDICES;
  }
  
  getSerializationProperties(): Object {
    return {distinctName: this.distinctName, reality: this.reality, properties: this.properties.toNullable(), words: this.words.toNullable(), speech: this.speech.toNullable(), category: this.category};
  }

  static create_jel_mapping = {distinctName: 0, category: 1, properties: 2, words: 3, speech: 4, reality: 5, hashCode: 6};
  static create(...args: any[]) {
    return new Thing(args[0], args[1], args[2], args[3], args[4], args[5], args[6]);
  }
}

Thing.prototype.JEL_PROPERTIES = {category: true};

