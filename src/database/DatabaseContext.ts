import Context from '../jel/Context';

import DbEntry from './DbEntry';
import DbSession from './DbSession';
import Category from './Category';
import Thing from './Thing';
import Dictionary from '../jel/Dictionary';

import FuzzyBoolean from './types/FuzzyBoolean';
import ApproximateNumber from './types/ApproximateNumber';
import Range from './types/Range';
import Fraction from './types/Fraction';
import UnitValue from './types/UnitValue';

const CTX_IDENTIFIERS = {DbEntry, Category, Thing, FuzzyBoolean, ApproximateNumber, Range, Fraction, UnitValue};

export default class DatabaseContext {
  static create(dbSession?: DbSession, translationDict?: Dictionary) {
    return new Context(undefined, dbSession, translationDict).setAll(CTX_IDENTIFIERS).freeze();
  }
}

