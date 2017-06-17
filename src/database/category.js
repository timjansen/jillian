'use strict';

const DbEntry = require('./dbentry.js');

const DB_INDICES = {catentries: {type: 'category', property: 'superCategory', includeParents: true}};

class Category extends DbEntry {

  constructor(distinctName, reality, hashCode, superCategory) {
    this.superCategory = superCategory;
    super(distinctName, reality, hashCode);
  }

  get databaseIndices() {
    return DB_INDICES;
  }
}

module.exports = Category;
