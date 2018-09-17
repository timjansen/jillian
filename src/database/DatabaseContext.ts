import Context from '../jel/Context';

import Database from './Database';
import DbEntry from './DbEntry';
import DbSession from './DbSession';
import DbRef from './DbRef';

import Category from './dbObjects/Category';
import Thing from './dbObjects/Thing';
import Enum from './dbObjects/Enum';

import CategoryPropertyType from './dbProperties/CategoryPropertyType';
import ComplexPropertyType from './dbProperties/ComplexPropertyType';
import DictionaryPropertyType from './dbProperties/DictionaryPropertyType';
import FunctionPropertyType from './dbProperties/FunctionPropertyType';
import ListPropertyType from './dbProperties/ListPropertyType';
import OptionPropertyType from './dbProperties/OptionPropertyType';
import SimplePropertyType from './dbProperties/SimplePropertyType';


import Math from '../jel/types/Math';
import Dictionary from '../jel/types/Dictionary';
import FuzzyBoolean from '../jel/types/FuzzyBoolean';
import ApproximateNumber from '../jel/types/ApproximateNumber';
import Range from '../jel/types/Range';
import Fraction from '../jel/types/Fraction';
import Unit from '../jel/types/Unit';
import UnitValue from '../jel/types/UnitValue';
import List from '../jel/types/List';
import Distribution from '../jel/types/Distribution';
import DistributionPoint from '../jel/types/DistributionPoint';
import Pattern from '../jel/types/Pattern';
import Translator from '../jel/types/Translator';
import EnumValue from '../jel/types/EnumValue';

const CTX_IDENTIFIERS = {DbEntry, DbRef, Category, Thing, Enum, 
												 CategoryPropertyType, ComplexPropertyType, DictionaryPropertyType, FunctionPropertyType, ListPropertyType, OptionPropertyType, SimplePropertyType,
												 FuzzyBoolean, ApproximateNumber, Range, Fraction, Unit, UnitValue,
												 Math, Dictionary, List, Distribution, DistributionPoint, Pattern, Translator, EnumValue, 
												 ___IS_DATABASE_CONTEXT: 'magic123'};

const DEFAULT_CONTEXT = new Context().setAll(CTX_IDENTIFIERS);

export default class DatabaseContext {
	static forDatabase(database: Database): Context {
		const session = new DbSession(database, DEFAULT_CONTEXT);
		return session.ctx;
  }
	
	static add(ctx?: Context): Context {
		if (!ctx)
			return DEFAULT_CONTEXT;
		else if (ctx.getOrNull('___IS_DATABASE_CONTEXT') == 'magic123')
			return ctx;
		else
	    return new Context(ctx).setAll(CTX_IDENTIFIERS);
	}
}

