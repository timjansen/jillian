import * as fs from 'fs-extra';
import * as path from 'path';

import BaseTypeRegistry from './BaseTypeRegistry';
import Context from './Context';
import LambdaExecutable from './LambdaExecutable';
import TypedParameterValue from './TypedParameterValue';
import Callable from './Callable';
import NativeCallable from './NativeCallable';
import LambdaCallable from './LambdaCallable';
import JelObject from './JelObject';

import ReferenceHelper from './types/ReferenceHelper';
import JelBoolean from './types/JelBoolean';
import Float from './types/Float';
import JelString from './types/JelString';
import Fraction from './types/Fraction';
import ApproximateNumber from './types/ApproximateNumber';
import JelMath from './types/Math';
import Dictionary from './types/Dictionary';
import Range from './types/Range';
import List from './types/List';
import Jel from './types/Jel';
import DistributionPoint from './types/DistributionPoint';
import Distribution from './types/Distribution';
import Pattern from './types/Pattern';
import Translator from './types/Translator';
import Match from './patternNodes/Match';
import EnumValue from './types/EnumValue';
import Enum from '../jel/types/Enum';
import Class from '../jel/types/Class';
import Package from '../jel/types/Package';
import Method from '../jel/types/Method';
import Property from '../jel/types/Property';
import PackageContent from '../jel/types/PackageContent';

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
import DateType from './types/typeDescriptors/DateType';
import DictionaryType from './types/typeDescriptors/DictionaryType';
import EnumType from './types/typeDescriptors/EnumType';
import FunctionType from './types/typeDescriptors/FunctionType';
import IntType from './types/typeDescriptors/IntType';
import NotType from './types/typeDescriptors/NotType';
import InRangeType from './types/typeDescriptors/InRangeType';
import ListType from './types/typeDescriptors/ListType';
import NumberType from './types/typeDescriptors/NumberType';
import NumericType from './types/typeDescriptors/NumericType';
import OptionType from './types/typeDescriptors/OptionType';
import OptionalType from './types/typeDescriptors/OptionalType';
import RangeType from './types/typeDescriptors/RangeType';
import RangableType from './types/typeDescriptors/RangableType';
import SimpleType from './types/typeDescriptors/SimpleType';
import StringType from './types/typeDescriptors/StringType';
import TimeType from './types/typeDescriptors/TimeType';
import JEL from './JEL';
import RuntimeError from './types/RuntimeError';
import AndType from './types/typeDescriptors/AndType';


const BOOT_SCRIPT = [
  {static: {any: AnyType.instance, int: IntType.instance, bool: BoolType.instance, function: FunctionType.instance, 
            number: NumberType.instance, numeric: NumericType.instance, string: StringType.instance, 
            date: DateType.instance, time: TimeType.instance}},
  [
    {jel: 'typeDescriptors/TypeDescriptor.jel'},
    {jel: 'NamedObject.jel'},
    {jel: 'Match.jel', native: Match},
    {jel: 'Jel.jel', native: Jel},
    {jel: 'Callable.jel', native: Callable},
    {jel: 'LambdaExecutable.jel', native: LambdaExecutable},
    {jel: 'ReferenceHelper.jel', native: ReferenceHelper}
  ],
  [
    {jel: 'typeDescriptors/SimpleType.jel', native: SimpleType},
    {jel: 'PackageContent.jel'},
    {jel: 'Property.jel', native: Property},
    {jel: 'Method.jel', native: Method},
    {jel: 'TypedParameterValue.jel', native: TypedParameterValue},
    {jel: 'LambdaCallable.jel', native: LambdaCallable},
    {jel: 'NativeCallable.jel', native: NativeCallable},
    {jel: 'log.jel', name: 'log'}
  ],
  [
    {jel: 'typeDescriptors/AnyType.jel', native: AnyType},
    {jel: 'typeDescriptors/BoolType.jel', native: BoolType},
    {jel: 'typeDescriptors/FunctionType.jel', native: FunctionType},
    {jel: 'typeDescriptors/IntType.jel', native: IntType},
    {jel: 'typeDescriptors/NumberType.jel', native: NumberType},
    {jel: 'typeDescriptors/NumericType.jel', native: NumericType},
    {jel: 'typeDescriptors/StringType.jel', native: StringType},
    {jel: 'typeDescriptors/DateType.jel', native: DateType},
    {jel: 'typeDescriptors/TimeType.jel', native: TimeType},
    {jel: 'typeDescriptors/typedef.jel', name: 'typedef'}
  ],
  [
    {jel: 'typeDescriptors/AndType.jel', native: AndType},
    {jel: 'typeDescriptors/ComplexType.jel', native: ComplexType},
    {jel: 'typeDescriptors/DictionaryType.jel', native: DictionaryType},
    {jel: 'typeDescriptors/EnumType.jel', native: EnumType},
    {jel: 'typeDescriptors/InRangeType.jel', native: InRangeType},
    {jel: 'typeDescriptors/ListType.jel', native: ListType},
    {jel: 'typeDescriptors/NotType.jel', native: NotType},
    {jel: 'typeDescriptors/OptionalType.jel', native: OptionalType},
    {jel: 'typeDescriptors/OptionType.jel', native: OptionType},
    {jel: 'typeDescriptors/RangableType.jel', native: RangableType},
    {jel: 'typeDescriptors/RangeType.jel', native: RangeType}
  ],
  [
    {jel: 'Class.jel', native: Class},
    {jel: 'Enum.jel', native: Enum},
    {jel: 'Package.jel', native: Package}
  ],
  [
    {jel: 'Boolean.jel', native: JelBoolean},
    {jel: 'EnumValue.jel', native: EnumValue},
    {jel: 'Float.jel', native: Float},
    {jel: 'String.jel', native: JelString},
    {jel: 'Range.jel', native: Range},
    {jel: 'List.jel', native: List},
    {jel: 'time/Duration.jel', native: Duration},
    {jel: 'time/TimeOfDay.jel', native: TimeOfDay},
    {jel: 'time/TimeDescriptor.jel'},
    {jel: 'time/TimeZone.jel', native: TimeZone}
  ],
  [
    {jel: 'Throwable.jel'},
    {jel: 'Dictionary.jel', native: Dictionary},
    {jel: 'Fraction.jel', native: Fraction},
    {jel: 'DistributionPoint.jel', native: DistributionPoint}, 
    {jel: 'Pattern.jel', native: Pattern},
    {jel: 'time/AbstractDate.jel'},
    {jel: 'time/DurationRange.jel', native: DurationRange},
    {jel: 'time/Timestamp.jel', native: Timestamp}
  ],
  [
    {jel: 'RuntimeError.jel', native: RuntimeError},
    {jel: 'Distribution.jel', native: Distribution},
    {jel: 'ApproximateNumber.jel', native: ApproximateNumber},
    {jel: 'Translator.jel', native: Translator},
    {jel: 'time/LocalDate.jel', native: LocalDate},
    {jel: 'Exception.jel'},
    {jel: 'Set.jel'}
  ],
  [
    {jel: 'Math.jel', native: JelMath}, 
    {jel: 'time/LocalDateTime.jel', native: LocalDateTime},
    {jel: 'time/ZonedDate.jel', native: ZonedDate},
    {jel: 'time/ZonedDateTime.jel', native: ZonedDateTime}
  ]
];

export default class DefaultContext {
  static readonly BOOTSTRAP_DIR = path.join(__dirname, '../../bootstrap/');
  static context: Context | Promise<Context> | undefined;
  


  private static async loadExpression(ctx: Context, basePath: string, classPath: string): Promise<JelObject> {
    return JEL.execute(await fs.readFile(path.join(basePath, classPath), {encoding: 'utf-8'}), classPath, ctx);
  }

  private static async loadNativeClass(ctx: Context, basePath: string, classPath: string, nativeClazzImpl: any): Promise<JelObject> {
    const jelClass = await DefaultContext.loadExpression(ctx, basePath, classPath);
    nativeClazzImpl.clazz = jelClass;
    return jelClass;
  }
  
  private static extendContextWithClass(ctxObject: any, jelClass: JelObject): any {
    if (jelClass instanceof PackageContent) 
      ctxObject[jelClass.distinctName] = jelClass;
    else
      throw new Error('Expected class, but got ' + jelClass.toString());
    return ctxObject;
  }
  
    
  private static extendContext(ctxObject: any, jelObject: JelObject, name: string): any {
    ctxObject[name] = jelObject;
    return ctxObject;
  }

  // descriptor: [...] for parallel loading, or {jel?: 'relative path to jel file', native?: NativeClass, static?: {static object defs}, name?: "name for unnamed expressions"}
  private static async load(ctx: Context, dir: string, descriptor: any): Promise<any> {

    if (descriptor[0])
      return (await Promise.all(descriptor.map((dl: any)=>DefaultContext.load(ctx, dir, dl)))).reduce((a: any,b: any)=>Object.assign(a,b), {});
    else if (descriptor.static)
      return descriptor.static;
    else if (descriptor.native)
      return DefaultContext.extendContextWithClass({}, await DefaultContext.loadNativeClass(ctx, dir, descriptor.jel, descriptor.native));
    else if (descriptor.name)
      return DefaultContext.extendContext({}, await DefaultContext.loadExpression(ctx, dir, descriptor.jel), descriptor.name);
    else 
      return DefaultContext.extendContextWithClass({}, await DefaultContext.loadExpression(ctx, dir, descriptor.jel));
  }
  
  static async createBootContext(dir: string, bootScript: any, parentContext?: Context): Promise<Context> {
    const ctxObject: any = {};
    let ctx = new Context(parentContext);
    for (let e of bootScript) {
      Object.assign(ctxObject, await DefaultContext.load(ctx, dir, e));
      ctx = new Context(parentContext).setAll(ctxObject, true);
    }
    return ctx;
  }

  static async loadDefaultContext(parentContext?: Context): Promise<Context> {
    return DefaultContext.createBootContext(DefaultContext.BOOTSTRAP_DIR, BOOT_SCRIPT, parentContext);
  }
  
	static async get(): Promise<Context> {
    if (DefaultContext.context)
      return DefaultContext.context;
   	DefaultContext.context = DefaultContext.loadDefaultContext();
    return DefaultContext.context;
	}

  static async plus(obj: any): Promise<Context> {
		return (await (DefaultContext.context || DefaultContext.get())).plus(obj);
	}
  
  static async with(f: (ctx: Context)=>any): Promise<any> {
    try {
      return f(await DefaultContext.get());    
    }
    catch (e) {
      console.log('Aborted DefaultContext.with:', e);
    }
  }
}

BaseTypeRegistry.register('DefaultContext', DefaultContext);
