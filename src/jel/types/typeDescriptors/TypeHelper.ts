import TypeDescriptor from './TypeDescriptor';
import SimpleType from './SimpleType';
import OptionType from './OptionType';
import ComplexType from './ComplexType';
import JelObject from '../../JelObject';
import Dictionary from '../../types/Dictionary';
import TypeChecker from '../../types/TypeChecker';
import List from '../../types/List';


export default class TypeHelper {
	/**
	 * Converts TypeDefintion, TypeDescriptor, DbRefs, List or Dictionary into a TypeDescriptor. It wraps the DbRef or Class into a SimpleType, and the
	 * Dictionary in a ComplexType. Lists become OptionTypes.
	 * @param l a TypeDefintion or TypeDescriptor or DbRef or Dictionary or List
	 * @return the TypeDescriptor
	 */
	static convert(l: JelObject): TypeDescriptor {
		if (TypeChecker.isIClass(l))
			return new SimpleType((l as any).className);
		else if (TypeChecker.isIDbRef(l))
			return new SimpleType((l as any).distinctName);
    else if (l instanceof Dictionary)
      return new ComplexType(l)
    else
      return l as TypeDescriptor;
	}

 	/**
	 * Converts TypeDefintion, TypeDescriptor, DbRefs, List or Dictionary into a TypeDescriptor. It wraps the DbRef or Class into a SimpleType, and the
	 * Dictionary in a ComplexType. Lists become OptionTypes.
	 * @param l a TypeDefintion or TypeDescriptor or DbRef or Dictionary or List, or null
	 * @return the TypeDescriptor
	 */
	static convertNullable(l: JelObject | null): TypeDescriptor | null {
		if (TypeChecker.isIClass(l))
			return new SimpleType((l as any).className);
		else if (TypeChecker.isIDbRef(l))
			return new SimpleType((l as any).distinctName);
    else if (l instanceof Dictionary)
      return new ComplexType(l)
    else
      return l as TypeDescriptor | null;
	}
  
  static convertFromAny(l: any, name: string): TypeDescriptor {
    if (l && (TypeChecker.isIClass(l) || l instanceof TypeDescriptor || l instanceof Dictionary || TypeChecker.isIDbRef(l)))
      return TypeHelper.convert(l);
    throw new Error(`Expected NativeClass or Class or DbRef or Dictionary or List in ${name}. But it is a ${l==null?'null': l.getJelType? l.getJelType() : 'Native: '+l.constructor.name}: ${l}`);
  }

  static convertNullableFromAny(l: any, name: string): TypeDescriptor | null {
    if ((!l) || TypeChecker.isIClass(l) || l instanceof TypeDescriptor || l instanceof Dictionary || TypeChecker.isIDbRef(l))
      return TypeHelper.convertNullable(l);
    throw new Error(`Expected NativeClass or Class or DbRef or Dictionary or List or null in ${name}. But it is a ${l==null?'null': l.getJelType? l.getJelType() : 'Native: '+l.constructor.name}: ${l}`);
  }

}




