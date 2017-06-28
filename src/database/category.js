'use strict';

const DbEntry = require('./dbentry.js');
const Utils = require('../util/utils.js');

const DB_INDICES = {catentries: {type: 'category', property: 'superCategory', includeParents: true}};

class Category extends DbEntry {

  constructor(distinctName, reality, hashCode, superCategory) {
    this.superCategory = superCategory; // warning: may be Promise!!
    super(distinctName, reality, hashCode);
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
  
    
  static create(distinctName, reality, hashCode, superCategory) {
    return new Category(distinctName, reality, hashCode, superCategory);
  }
}

Category.create_jel_mapping = {distinctName: 0, reality: 1, hashCode: 2, superCategory: 3};


module.exports = Category;
