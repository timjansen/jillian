import Context from './Context';

import JelBoolean from './types/JelBoolean';
import JelNumber from './types/JelNumber';
import JelString from './types/JelString';
import Fraction from './types/Fraction';
import ApproximateNumber from './types/ApproximateNumber';
import Unit from './types/Unit';
import UnitValue from './types/UnitValue';
import JelMath from './types/Math';
import Dictionary from './types/Dictionary';
import Range from './types/Range';
import List from './types/List';
import DistributionPoint from './types/DistributionPoint';
import Distribution from './types/Distribution';
import Pattern from './types/Pattern';
import Translator from './types/Translator';
import EnumValue from './types/EnumValue';

import Duration from './types/time/Duration';
import DurationRange from './types/time/DurationRange';
import Timestamp from './types/time/Timestamp';
import TimeZone from './types/time/TimeZone';
import TimeOfDay from './types/time/TimeOfDay';
import LocalDate from './types/time/LocalDate';
import LocalDateTime from './types/time/LocalDateTime';
import ZonedDate from './types/time/ZonedDate';
import ZonedDateTime from './types/time/ZonedDateTime';

import ComplexType from './types/typeDescriptors/ComplexType';
import DictionaryType from './types/typeDescriptors/DictionaryType';
import FunctionType from './types/typeDescriptors/FunctionType';
import ListType from './types/typeDescriptors/ListType';
import OptionType from './types/typeDescriptors/OptionType';
import SimpleType from './types/typeDescriptors/SimpleType';


const CTX_IDENTIFIERS = {Boolean: JelBoolean, Number: JelNumber, String: JelString, ApproximateNumber, Range, Fraction, Unit, UnitValue,
												 Math: JelMath, Dictionary, List, Distribution, DistributionPoint, Pattern, Translator, EnumValue, 
												 Duration, DurationRange, Timestamp, TimeZone, TimeOfDay, LocalDate, LocalDateTime, ZonedDate, ZonedDateTime,
                         ComplexType, DictionaryType, FunctionType, ListType, OptionType, SimpleType,
												 ___IS_DEFAULT_CONTEXT: 'magic123'};

export default class DefaultContext {
	static readonly DEFAULT_CONTEXT = new Context().setAll(CTX_IDENTIFIERS);
	static get(): Context {
		return DefaultContext.DEFAULT_CONTEXT;
	}
	static plus(obj: any): Context {
		return DefaultContext.DEFAULT_CONTEXT.plus(obj);
	}
}

