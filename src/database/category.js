'use strict';

const DbEntry = require('./dbentry.js');
const Utils = require('../util/utils.js');

const DB_INDICES = {subCategories: {type: 'category', property: 'superCategory', includeParents: true}};

class Category extends DbEntry {

  constructor(distinctName, superCategory, properties, words, speech, reality, hashCode) {
    super(distinctName, properties, words, speech, reality, hashCode);
    this.superCategory = superCategory; // warning: may be Promise or DbRef!!
  }

  // returns promise with all matching bjects
  getDirectInstances(ctx, filterFunc) {
    return ctx.dbSession.getOfIndex(this, 'catentries', filterFunc);
  }

  getAllInstances(ctx, filterFunc) {
    if (this.superCategory) {
      const directInstances = this.getDirectInstances(ctx, filterFunc);
      const superPromise = Utils.promisefy(this.superCategory).then(superCategory=>this.superCategory=superCategory);
      return Promise.all([directInstances, superPromise])
        .then(()=>this.superCategory.getAllInstances(ctx, filterFunc)); // explicitly avoid running two get**Instances() in parallel...
    }
    else
      return this.getDirectInstances(ctx, filterFunc);
  }

  get databaseIndices() {
    return DB_INDICES;
  }
  
  getSerializationProperties() {
    return {distinctName: this.distinctName, reality: this.reality, properties: this.properties, words: this.words, speech: this.speech, superCategory: this.superCategory};
  }
    
  static create(distinctName, superCategory, properties, words, speech, reality, hashCode) {
    return new Category(distinctName, superCategory, properties, words, speech, reality, hashCode);
  }
}

Category.create_jel_mapping = {distinctName: 0, superCategory: 1, properties: 2, words: 3, speech: 4, reality: 5, hashCode: 6};
Category.prototype.JEL_PROPERTIES = {superCategory: true};


module.exports = Category;
