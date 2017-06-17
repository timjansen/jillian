'use strict';

const DbEntry = require('./dbentry.js');

const DB_INDICES = {catentries: {type: 'category', property: 'category', includeParents: true}};


// Base class for any kind of physical or immaterial instance of a category
class Thing extends DbEntry {
  
  constructor(distinctName, reality, hashCode, category) {
    this.category = category;
    super(distinctName, reality, hashCode);
  }
  
  get databaseIndices() {
    return DB_INDICES;
  }
  
}

module.exports = Thing;


