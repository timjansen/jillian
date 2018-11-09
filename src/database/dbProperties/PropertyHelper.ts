import PropertyType from './PropertyType';
import SimplePropertyType from './SimplePropertyType';
import OptionPropertyType from './OptionPropertyType';
import ComplexPropertyType from './ComplexPropertyType';
import {IDbRef} from '../../jel/IDatabase';
import Dictionary from '../../jel/types/Dictionary';
import TypeChecker from '../../jel/types/TypeChecker';
import List from '../../jel/types/List';


export default class PropertyHelper {
	/**
	 * Converts PropertyType, DbRefs or Dictionary into a PropertyType. It wraps the DbRef into a SimplePropertyType, and the
	 * Dictionary in a DictionaryPropertyType.
	 * @param l a PropertyTypes or DbRef or Dictionary
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
	 * @param l a PropertyTypes or DbRef or Dictionary
	 * @return the PropertyTypes
	 */
	static convertNullable(l: List | PropertyType | IDbRef | Dictionary | null): PropertyType | null {
		if (l instanceof List)
			return new OptionPropertyType(l);
		else 
			return (l && (l as any).isIDBRef)? new SimplePropertyType(l as any) : l instanceof Dictionary ? new ComplexPropertyType(l) : (l as PropertyType | null);
	}

}




