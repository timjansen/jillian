import PropertyType from './PropertyType';
import SimplePropertyType from './SimplePropertyType';
import OptionPropertyType from './OptionPropertyType';
import ComplexPropertyType from './ComplexPropertyType';
import {IDbRef} from '../../IDatabase';
import Dictionary from '../../types/Dictionary';
import TypeChecker from '../../types/TypeChecker';
import List from '../../types/List';


export default class PropertyHelper {
	/**
	 * Converts PropertyType, DbRefs or Dictionary into a PropertyType. It wraps the DbRef into a SimplePropertyType, and the
	 * Dictionary in a DictionaryPropertyType.
	 * @param l a PropertyTypes or DbRef or Dictionary or List
	 * @return the PropertyTypes
	 */
	static convert(l: List | PropertyType | IDbRef | Dictionary): PropertyType {
		if (l instanceof List)
			return new OptionPropertyType(l);
		else 
			return (l && (l as any).isIDBRef)? new SimplePropertyType(l as any) : l instanceof Dictionary ? new ComplexPropertyType(l) : (l as PropertyType);
	}

 	/**
	 * Converts PropertyType, DbRefs or Dictionary into a PropertyType. It wraps the DbRef into a SimplePropertyType, and the
	 * Dictionary in a DictionaryPropertyType.
	 * @param l a PropertyTypes or DbRef or Dictionary or List
	 * @return the PropertyTypes
	 */
	static convertNullable(l: List | PropertyType | IDbRef | Dictionary | null): PropertyType | null {
		if (l instanceof List)
			return new OptionPropertyType(l);
		else 
			return (l && (l as any).isIDBRef)? new SimplePropertyType(l as any) : l instanceof Dictionary ? new ComplexPropertyType(l) : (l as PropertyType | null);
	}
  
  static convertFromAny(l: any, name: string): PropertyType {
    if (l && (l instanceof List || l instanceof PropertyType || l instanceof Dictionary || (l as any).isIDBRef))
      return PropertyHelper.convert(l);
    throw new Error('Expected PropertyType or DbRef or Dictionary or List in ' + name);
  }

  static convertNullableFromAny(l: any, name: string): PropertyType | null {
    if ((!l) || l instanceof List || l instanceof PropertyType || l instanceof Dictionary || (l as any).isIDBRef)
      return PropertyHelper.convertNullable(l);
    throw new Error('Expected PropertyType or DbRef or Dictionary or List or null in ' + name);
  }

}




