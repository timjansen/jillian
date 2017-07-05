'use strict';

const DbEntry = require('./dbentry.js');
const DbRef = require('./dbref.js');

const DB_INDICES = {catEntries: {type: 'category', property: 'category', includeParents: true}};


// Base class for any kind of physical or immaterial instance of a category
class Thing extends DbEntry {
  
  constructor(distinctName, category, properties, words, speech, reality, hashCode) {
    super(distinctName, properties, words, speech, reality, hashCode);
    this.category = DbRef.create(category);
  }
  
  get databaseIndices() {
    return DB_INDICES;
  }
  
  getSerializationProperties() {
    return {distinctName: this.distinctName, reality: this.reality, properties: this.properties.toNullable(), words: this.words.toNullable(), speech: this.speech.toNullable(), category: this.category};
  }

  
  static create(distinctName, category, properties, words, speech, reality, hashCode) {
    return new Thing(distinctName, category, properties, words, speech, reality, hashCode);
  }
}

Thing.create_jel_mapping = {distinctName: 0, category: 1, properties: 2, words: 3, speech: 4, reality: 5, hashCode: 6};
Thing.prototype.JEL_PROPERTIES = {category: true};

module.exports = Thing;


