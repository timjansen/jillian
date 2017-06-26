'use strict';

const JelType = require('../jel/type.js');
const tifu = require('tifuhash');

// Base class for any kind of physical or immaterial instance of a category

class DbEntry extends JelType {
  
  constructor(distinctName, reality, hashCode) {
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
  
}

module.exports = DbEntry;
