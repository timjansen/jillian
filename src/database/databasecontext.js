'use strict';

const Context = require('../jel/context.js');

const DbEntry = require('./dbentry.js');
const Category = require('./category.js');
const Thing = require('./thing.js');

const FuzzyBoolean = require('./types/fuzzyboolean.js');

const CTX_IDENTIFIERS = {DbEntry, Category, Thing, FuzzyBoolean};

class DatabaseContext {
  static create(dbSession, translationDict) {
    return new Context(null, dbSession, translationDict).setAll(CTX_IDENTIFIERS).freeze();
  }
}

module.exports = DatabaseContext;
