import TypeDescriptor from './TypeDescriptor';
import SimpleType from './SimpleType';
import InRangeType from './InRangeType';
import EnumType from './EnumType';
import ComplexType from './ComplexType';
import NumberType from './NumberType';
import JelObject from '../../JelObject';
import BaseTypeRegistry from '../../BaseTypeRegistry';
import Range from '../Range';
import Float from '../Float';
import Enum from '../Enum';
import Class from '../Class';
import Fraction from '../Fraction';
import UnitValue from '../UnitValue';
import Dictionary from '../Dictionary';
import TypeChecker from '../TypeChecker';
import GenericJelObject from '../GenericJelObject';
import GenericTypeAdaptor from './GenericTypeAdaptor';


export default class TypeHelper {
  
 	/**
	 * Converts Class, Enum, DbRefs, List, Range or Dictionary into a TypeDescriptor. It wraps the DbRef into a ReferenceDispatcherType, and the
	 * Dictionary in a ComplexType. Lists become OptionTypes. Ranges become InRangeTypes. Enums become EnumType. TypeDescriptors are just returned as-is.
	 * @param l a TypeDescriptor or Class or DbRef or Dictionary or List or Range or Enum, or null
	 * @return the TypeDescriptor
	 */
	static convertToTypeDescriptor(l: JelObject, name: string): TypeDescriptor {
    if (l instanceof TypeDescriptor)
      return l;
    else if (l instanceof GenericJelObject)
      return new GenericTypeAdaptor(l);
		else if (TypeChecker.isIDbRef(l))
			return BaseTypeRegistry.get('ReferenceDispatcherType').valueOf(l);
    else if (l instanceof Dictionary)
      return new ComplexType(l);
    else if (l instanceof Range) {
      if (l.min instanceof Float || l.min instanceof Fraction || (l.min == null && (l.max instanceof Float || l.max instanceof Fraction)))
        return new NumberType(l);
      else if (l.min instanceof UnitValue || (l.min == null && (l.max instanceof UnitValue)))
        return BaseTypeRegistry.get('UnitValueType').valueOf(l.min ? l.min.unit : (l.max as UnitValue).unit, l);
      else
        return new InRangeType(l);
    }
    else if (l instanceof Enum)
      return new EnumType(l.distinctName);
		else if (l instanceof Class)
      return new SimpleType((l as any).name);
  
    throw new Error(`Expected TypeDescriptor or Class or Enum or DbRef or Dictionary or List or Range in ${name}. But it is ` + (l==null?'null.' : `${l.className? l.className : 'Native: '+l.constructor.name}: ${l}`));
  }
  
  static convertFromAny(l: any, name: string): TypeDescriptor {
    return TypeHelper.convertToTypeDescriptor(l, name);
  }

  static convertNullableFromAny(l: any, name: string): TypeDescriptor | null {
    if (!l)
      return null;
    return TypeHelper.convertToTypeDescriptor(l, name);
  }

}

BaseTypeRegistry.register('TypeHelper', TypeHelper);



