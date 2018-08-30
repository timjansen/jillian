import Context from '../jel/Context';

import DbEntry from './DbEntry';
import DbSession from './DbSession';
import DbRef from './DbRef';
import Category from './dbObjects/Category';
import Thing from './dbObjects/Thing';

import Math from '../jel/types/Math';
import Dictionary from '../jel/types/Dictionary';
import FuzzyBoolean from '../jel/types/FuzzyBoolean';
import ApproximateNumber from '../jel/types/ApproximateNumber';
import Range from '../jel/types/Range';
import Fraction from '../jel/types/Fraction';
import UnitValue from '../jel/types/UnitValue';
import List from '../jel/types/List';
import Distribution from '../jel/types/Distribution';
import DistributionPoint from '../jel/types/DistributionPoint';
import Pattern from '../jel/types/Pattern';
import Translator from '../jel/types/Translator';
import EnumValue from '../jel/types/EnumValue';

const CTX_IDENTIFIERS = {DbEntry, DbRef, Category, Thing, FuzzyBoolean, ApproximateNumber, Range, Fraction, UnitValue,
												Math, Dictionary, List, Distribution, DistributionPoint, Pattern, Translator,
												EnumValue};

export default class DatabaseContext {
  static create(ctx?: Context, dbSession?: DbSession, translationDict?: Dictionary): Context {
    return new Context(ctx, dbSession, translationDict).setAll(CTX_IDENTIFIERS);
  }
	
	static add(ctx: Context): Context {
		if (ctx instanceof DatabaseContext)
			return ctx;
		else
			return DatabaseContext.create(ctx);
	}
}

