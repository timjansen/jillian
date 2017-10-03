import Context from '../jel/Context';

import DbEntry from './DbEntry';
import DbSession from './DbSession';
import Category from './Category';
import Thing from './Thing';
import Dictionary from '../jel/Dictionary';

import FuzzyBoolean from './types/FuzzyBoolean';

const CTX_IDENTIFIERS = {DbEntry, Category, Thing, FuzzyBoolean};

export default class DatabaseContext {
  static create(dbSession?: DbSession, translationDict?: Dictionary) {
    return new Context(null, dbSession, translationDict).setAll(CTX_IDENTIFIERS).freeze();
  }
}

