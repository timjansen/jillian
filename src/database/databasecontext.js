'use strict';

const Context = require('../jel/context.js');

const DbEntry = require('./dbentry.js');
const Category = require('./category.js');
const Thing = require('./thing.js');

const Area = require('./types/area.js');
const FuzzyBoolean = require('./types/fuzzyboolean.js');
const Length = require('./types/length.js');
const Range = require('./types/range.js');
const ValueDistribution = require('./types/valuedistribution.js');
const Volume = require('./types/volume.js');

const CTX_IDENTIFIERS = {DbEntry, Category, Thing, Area, FuzzyBoolean, Length, Range, ValueDistribution, Volume};

class DatabaseContext {
  static create(dbSession, translationDict) {
    return new Context(null, dbSession, translationDict).setAll(CTX_IDENTIFIERS).freeze();
  }
}

module.exports = DatabaseContext;
