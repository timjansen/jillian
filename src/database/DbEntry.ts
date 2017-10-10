import JelType from '../jel/JelType';
import Serializable from '../jel/Serializable';
import Dictionary from '../jel/Dictionary';
import DbIndexDescriptor from './DbIndexDescriptor';
import List from '../jel/List';

const tifu = require('tifuhash');

// Base class for any kind of physical or immaterial instance of a category
// Note that all references to other DbEntrys must be stored as a DbRef!!
export default class DbEntry extends JelType {
  //words: Dictionary; // Dictionary: language -> word -> probability
  
  constructor(public distinctName: string, public reality: any, public hashCode: string = tifu.hash(distinctName), public properties = new Dictionary(), public words = new Dictionary(), public speech = new List()) {
    super();
  }
  
//  addWord(language, word, probability = 1) {
//  }
  
//  addSentence(sentence) {
//  }

  // returns a map index_name->{type: 'index-type, only category for now', property: 'the name of the property to index', includeParents: 'bool. for categories, if true, index for all parent cats as well'}
  get databaseIndices(): Map<string, DbIndexDescriptor> {
    return new Map();
  }
  
  getSerializationProperties(): Object {
    return {distinctName: this.distinctName, reality: this.reality, properties: this.properties.toNullable(), words: this.words.toNullable(), speech: this.speech.toNullable()};
  }

  static create_jel_mapping = {distinctName: 0, reality: 1, hashCode: 2, properties: 3, words: 4, speech: 5};
  static create(...args: any[]): any {
    return new DbEntry(args[0], args[1], args[3], args[4], args[5]);
  }
}


