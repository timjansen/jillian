import Category from './Category';
import DbEntry from './DbEntry';
import DbRef from './DbRef';
import Dictionary from '../jel/Dictionary';
import List from '../jel/List';

const DB_INDICES = {catEntries: {type: 'category', property: 'category', includeParents: true}};


// Base class for any kind of physical or immaterial instance of a category
export default class Thing extends DbEntry {
  category: DbRef;
  JEL_PROPERTIES: Object;
  
  constructor(distinctName: string, category: Category, properties = new Dictionary(), words = new Dictionary(), speech = new List(), reality: any, hashCode: string) {
    super(distinctName, reality, hashCode, properties, words);
    this.category = DbRef.create(category);
  }
  
  get databaseIndices(): Object {
    return DB_INDICES;
  }
  
  getSerializationProperties(): Object {
    return {distinctName: this.distinctName, reality: this.reality, properties: this.properties.toNullable(), words: this.words.toNullable(), speech: this.speech.toNullable(), category: this.category};
  }

  static create_jel_mapping = {distinctName: 0, category: 1, properties: 2, words: 3, speech: 4, reality: 5, hashCode: 6};
  static create(distinctName, category, properties, words, speech, reality, hashCode) {
    return new Thing(distinctName, category, properties, words, speech, reality, hashCode);
  }
}

Thing.prototype.JEL_PROPERTIES = {category: true};


