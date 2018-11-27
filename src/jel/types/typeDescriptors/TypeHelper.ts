import TypeDescriptor from './TypeDescriptor';
import SimpleType from './SimpleType';
import OptionType from './OptionType';
import ComplexType from './ComplexType';
import {IDbRef} from '../../IDatabase';
import Dictionary from '../../types/Dictionary';
import TypeChecker from '../../types/TypeChecker';
import List from '../../types/List';


export default class TypeHelper {
	/**
	 * Converts TypeDescriptor, DbRefs or Dictionary into a TypeDescriptor. It wraps the DbRef into a SimpleType, and the
	 * Dictionary in a DictionaryType.
	 * @param l a TypeDescriptor or DbRef or Dictionary or List
	 * @return the TypeDescriptor
	 */
	static convert(l: List | TypeDescriptor | IDbRef | Dictionary): TypeDescriptor {
		if (l instanceof List)
			return new OptionType(l);
		else if (l && (l as any).isIDBRef)
			return new SimpleType(l as any);
    else if (l instanceof Dictionary)
      return new ComplexType(l)
    else
      return l as TypeDescriptor;
	}

 	/**
	 * Converts TypeDescriptor, DbRefs or Dictionary into a TypeDescriptor. It wraps the DbRef into a SimpleType, and the
	 * Dictionary in a DictionaryType.
	 * @param l a Types or DbRef or Dictionary or List
	 * @return the TypeDescriptor
	 */
	static convertNullable(l: List | TypeDescriptor | IDbRef | Dictionary | null): TypeDescriptor | null {
		if (l instanceof List)
			return new OptionType(l);
		else if (l && (l as any).isIDBRef)
			return new SimpleType(l as any);
    else if (l instanceof Dictionary)
      return new ComplexType(l)
    else
      return l as TypeDescriptor | null;
	}
  
  static convertFromAny(l: any, name: string): TypeDescriptor {
    if (l && (l instanceof List || l instanceof TypeDescriptor || l instanceof Dictionary || (l as any).isIDBRef))
      return TypeHelper.convert(l);
    throw new Error('Expected Type or DbRef or Dictionary or List in ' + name);
  }

  static convertNullableFromAny(l: any, name: string): TypeDescriptor | null {
    if ((!l) || l instanceof List || l instanceof TypeDescriptor || l instanceof Dictionary || (l as any).isIDBRef)
      return TypeHelper.convertNullable(l);
    throw new Error('Expected Type or DbRef or Dictionary or List or null in ' + name);
  }

}




