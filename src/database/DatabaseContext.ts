import Context from '../jel/Context';

import DbEntry from './DbEntry';
import DbSession from './DbSession';
import Category from './Category';
import Thing from './Thing';

import Dictionary from '../jel/types/Dictionary';
import FuzzyBoolean from '../jel/types/FuzzyBoolean';
import ApproximateNumber from '../jel/types/ApproximateNumber';
import Range from '../jel/types/Range';
import Fraction from '../jel/types/Fraction';
import UnitValue from '../jel/types/UnitValue';

const CTX_IDENTIFIERS = {DbEntry, Category, Thing, FuzzyBoolean, ApproximateNumber, Range, Fraction, UnitValue};

export default class DatabaseContext {
  static create(dbSession?: DbSession, translationDict?: Dictionary) {
    return new Context(undefined, dbSession, translationDict).setAll(CTX_IDENTIFIERS).freeze();
  }
}

