import PropertyType from './PropertyType';
import SimplePropertyType from './SimplePropertyType';
import OptionPropertyType from './OptionPropertyType';
import ComplexPropertyType from './ComplexPropertyType';
import DbRef from '../DbRef';
import Dictionary from '../../jel/types/Dictionary';
import List from '../../jel/types/List';


export default class PropertyHelper {
	/**
	 * Converts PropertyType, DbRefs or Dictionary into a PropertyType. It wraps the DbRef into a SimplePropertyType, and the
	 * Dictionary in a DictionaryPropertyType.
	 * @param l a PropertyTypes or DbRef or Dictionary
	 * @return the PropertyTypes
	 */
	static convert(l: List | PropertyType | DbRef | Dictionary): PropertyType {
		if (l instanceof List)
			return new OptionPropertyType(l);
		else 
			return l instanceof DbRef ? new SimplePropertyType(l) : l instanceof Dictionary ? new ComplexPropertyType(l) : l;
	}
	
}




