import Category from './Category';
import DbEntry from '../DbEntry';
import DbRef from '../DbRef';
import PropertyType from '../dbProperties/PropertyType';
import DbIndexDescriptor from '../DbIndexDescriptor';
import Dictionary from '../../jel/types/Dictionary';
import List from '../../jel/types/List';


/**
 * Defines a property, e.g. @size or @dimensions or @firstName
 */
export default class PropertyDefinition extends DbEntry {
  JEL_PROPERTIES: Object;
  
	/**
	 * Creates a new instance.
	 * @param distinctName the property name. Must start with lower-case letter.
	 * @param type the PropertyType that describes the allowed values.
	 * @param categoryProperty if this is a property for Thing instances, this allowes linking
	 *        to a category-based properties. For example, a property @length to describe the 
	 *        length of a Thing may be related to a category-level property @lengthDistribution
	 *        that describes min/max lengths and averages.
	 */
  constructor(distinctName: string, public type: PropertyType, public categoryProperty?: DbRef) {
    super(distinctName, null);
		if (!distinctName.match(/^[a-z]/))
			throw Error('By convention, all PropertyDefinition names must begin with a lower-case letter. Illegal name: ' + distinctName);
  }
  
  getSerializationProperties(): Object {
    return {distinctName: this.distinctName, type: this.type};
  }

  static create_jel_mapping = {distinctName: 0, type: 1, categoryProperty: 2};
  static create(...args: any[]) {
    return new PropertyDefinition(args[0], args[1], args[2]);
  }
}

PropertyDefinition.prototype.JEL_PROPERTIES = {distinctName: true};



