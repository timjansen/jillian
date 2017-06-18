'use strict';

const Context = require('../jel/context.js');
const Area = require('./types/area.js');
const FuzzyBoolean = require('./types/fuzzyboolean.js');
const Length = require('./types/length.js');
const Range = require('./types/range.js');
const ValueDistribution = require('./types/valuedistribution.js');
const Volume = require('./types/volume.js');

const CTX_IDENTIFIERS = {Area, FuzzyBoolean, Length, Range, ValueDistribution, Volume};

class DatabaseContext {
  static create(dbSession) {
    return new Context(CTX_IDENTIFIERS, null, dbSession);
  }
}

