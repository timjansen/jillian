import TypeDescriptor from './TypeDescriptor';
import SimpleType from './SimpleType';
import InRangeType from './InRangeType';
import OptionType from './OptionType';
import ComplexType from './ComplexType';
import JelObject from '../../JelObject';
import BaseTypeRegistry from '../../BaseTypeRegistry';
import Range from '../../types/Range';
import Float from '../../types/Float';
import Fraction from '../../types/Fraction';
import Dictionary from '../../types/Dictionary';
import TypeChecker from '../../types/TypeChecker';
import List from '../../types/List';

export default class TypeHelper {
  
 	/**
	 * Converts TypeDefintion, TypeDescriptor, DbRefs, List, Range or Dictionary into a TypeDescriptor. It wraps the DbRef or Class into a SimpleType, and the
	 * Dictionary in a ComplexType. Lists become OptionTypes. Ranges become InRangeTypes.
	 * @param l a TypeDefintion or TypeDescriptor or DbRef or Dictionary or List or Range, or null
	 * @return the TypeDescriptor
	 */
	static convertNullable(l: JelObject, name: string): TypeDescriptor {
    if (l instanceof TypeDescriptor)
      return l;
		else if (TypeChecker.isIDbRef(l))
			return BaseTypeRegistry.get('ReferenceDispatcherType').valueOf(l);
    else if (l instanceof Dictionary)
      return new ComplexType(l);
    else if (l instanceof Range)
      return new InRangeType(l);
		else if (TypeChecker.isIClass(l))
			return new SimpleType((l as any).className);
  
    throw new Error(`Expected NativeClass or Class or DbRef or Dictionary or List or Range in ${name}. But it is ` + (l==null?'null.' : `${l.getJelType? l.getJelType() : 'Native: '+l.constructor.name}: ${l}`));
  }
  
  static convertFromAny(l: any, name: string): TypeDescriptor {
    return TypeHelper.convertNullable(l, name);
  }

  static convertNullableFromAny(l: any, name: string): TypeDescriptor | null {
    if (!l)
      return null;
    return TypeHelper.convertNullable(l, name);
  }

}

BaseTypeRegistry.register('TypeHelper', TypeHelper);



