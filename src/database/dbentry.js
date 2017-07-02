'use strict';

const JelType = require('../jel/type.js');
const Dictionary = require('../jel/dictionary.js');
const List = require('../jel/list.js');
const tifu = require('tifuhash');

// Base class for any kind of physical or immaterial instance of a category
// Note that all references to other DbEntrys must be stored as a DbRef!!
class DbEntry extends JelType {
  
  constructor(distinctName, reality, hashCode, properties = new Dictionary(), words = new Dictionary(), speech = new List()) {
    super();
    this.distinctName = distinctName;
    this.reality = reality;
    this.hashCode = hashCode || tifu.hash(distinctName);

    this.words = words; // Dictionary: language -> word -> probability
    this.properties = properties;
    this.speech = speech;
  }
  
  addWord(language, word, probability = 1) {
  }
  
  addSentence(sentence) {
  }

  // returns a map index_name->{type: 'index-type, only category for now', property: 'the name of the property to index', includeParents: 'bool. for categories, if true, index for all parent cats as well'}
  get databaseIndices() {
    return {};
  }
  
  getSerializationProperties() {
    return {distinctName: this.distinctName, reality: this.reality, properties: this.properties.toNullable(), words: this.words.toNullable(), speech: this.speech.toNullable()};
  }
  
  static create(distinctName, reality, hashCode) {
    return new DbEntry(distinctName, reality, hashCode);
  }
}

DbEntry.create_jel_mapping = {distinctName: 0, reality: 1, hashCode: 2, properties: 3, words: 4, speech: 5};

module.exports = DbEntry;
