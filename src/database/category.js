'use strict';

const DbEntry = require('./dbentry.js');
const DbRef = require('./dbref.js');
const DatabaseSession = require('./databasesession.js');

const DB_INDICES = {subCategories: {type: 'category', property: 'superCategory', includeParents: true}};

class Category extends DbEntry {

  constructor(distinctName, superCategory, properties, words, speech, reality, hashCode) {
    super(distinctName, properties, words, speech, reality, hashCode);
    this.superCategory = DbRef.create(superCategory); 
  }

  // returns promise with all matching bjects
  getInstances(ctx, filterFunc) {
    return DbRef.getSession(ctx).getByIndex(this, 'catEntries', filterFunc);
  }

  get databaseIndices() {
    return DB_INDICES;
  }
  
  getSerializationProperties() {
    return {distinctName: this.distinctName, reality: this.reality, properties: this.properties.toNullable(), words: this.words.toNullable(), speech: this.speech.toNullable(), superCategory: this.superCategory};
  }
    
  static create(distinctName, superCategory, properties, words, speech, reality, hashCode) {
    return new Category(distinctName, superCategory, properties, words, speech, reality, hashCode);
  }
}

Category.create_jel_mapping = {distinctName: 0, superCategory: 1, properties: 2, words: 3, speech: 4, reality: 5, hashCode: 6};
Category.prototype.JEL_PROPERTIES = {superCategory: true};


module.exports = Category;
