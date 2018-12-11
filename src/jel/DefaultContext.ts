import Context from './Context';
import NativeClass from './NativeClass';

import JelBoolean from './types/JelBoolean';
import Float from './types/Float';
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

import AnyType from './types/typeDescriptors/AnyType';
import BoolType from './types/typeDescriptors/BoolType';
import ComplexType from './types/typeDescriptors/ComplexType';
import DictionaryType from './types/typeDescriptors/DictionaryType';
import FunctionType from './types/typeDescriptors/FunctionType';
import IntType from './types/typeDescriptors/IntType';
import ListType from './types/typeDescriptors/ListType';
import NumberType from './types/typeDescriptors/NumberType';
import OptionType from './types/typeDescriptors/OptionType';
import OptionalType from './types/typeDescriptors/OptionalType';
import RangeType from './types/typeDescriptors/RangeType';
import SimpleType from './types/typeDescriptors/SimpleType';
import StringType from './types/typeDescriptors/StringType';

function c(ctor: any): NativeClass {
  return new NativeClass(ctor);
}

const CTX_IDENTIFIERS = {Boolean: c(JelBoolean), Float: c(Float), String: c(JelString), ApproximateNumber: c(ApproximateNumber), Math: c(JelMath), 
                         Range: c(Range), Fraction: c(Fraction), Unit: c(Unit), UnitValue: c(UnitValue),
												 Dictionary: c(Dictionary), List: c(List), Distribution: c(Distribution), DistributionPoint: c(DistributionPoint), Pattern: c(Pattern), Translator: c(Translator), EnumValue: c(EnumValue), 
												 Duration: c(Duration), DurationRange: c(DurationRange), Timestamp: c(Timestamp), TimeZone: c(TimeZone), TimeOfDay: c(TimeOfDay), LocalDate: c(LocalDate), LocalDateTime: c(LocalDateTime), 
                         ZonedDate: c(ZonedDate), ZonedDateTime: c(ZonedDateTime),
                         AnyType: c(AnyType), BoolType: c(BoolType), ComplexType: c(ComplexType), DictionaryType: c(DictionaryType), FunctionType: c(FunctionType), IntType: c(IntType), ListType: c(ListType), OptionType: c(OptionType), 
                         NumberType: c(NumberType), OptionalType: c(OptionalType), RangeType: c(RangeType), SimpleType: c(SimpleType), StringType: c(StringType),
                         any: AnyType.instance, int: IntType.instance, bool: BoolType.instance, number: NumberType.instance, string: StringType.instance,
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

