'use strict';

const JelType = require('../jel/type.js');
const tifu = require('tifuhash');

// Base class for any kind of physical or immaterial instance of a category

class DbEntry extends JelType {
  
  constructor(distinctName, reality, hashCode) {
    super();
    this.distinctName = distinctName;
    this.reality = reality;
    this.hashCode = hashCode || tifu.hash(distinctName);

    this.words = {};
    this.properties = {};
    this.speech = [];
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
    return {distinctName: this.distinctName, reality: this.reality};
  }
  
  static create(distinctName, reality, hashCode) {
    return new DbEntry(distinctName, reality, hashCode);
  }
}

DbEntry.create_jel_mapping = {distinctName: 0, reality: 1, hashCode: 2};

module.exports = DbEntry;
