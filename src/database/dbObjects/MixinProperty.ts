import Category from './Category';
import DbEntry from '../DbEntry';
import DbRef from '../DbRef';
import Context from '../../jel/Context';
import TypeDescriptor from '../../jel/types/typeDescriptors/TypeDescriptor';
import TypeHelper from '../../jel/types/typeDescriptors/TypeHelper';
import DbIndexDescriptor from '../DbIndexDescriptor';
import Dictionary from '../../jel/types/Dictionary';
import TypeChecker from '../../jel/types/TypeChecker';
import List from '../../jel/types/List';
import JelString from '../../jel/types/JelString';


/**
 * Defines a property used by several categories, e.g. @size or @dimensions or @firstName
 */
export default class MixinProperty extends DbEntry {
  JEL_PROPERTIES: Object;
	public type: TypeDescriptor;
  
	/**
	 * Creates a new instance.
	 * @param distinctName the mixin property name. Must start with lower-case letter.
	 * @param type the TypeDescriptor that describes the allowed values. 
	 * @param categoryProperty if this is a property for Thing instances, this allows linking
	 *        to a category-based properties. For example, a property @length to describe the 
	 *        length of a Thing may be related to a category-level property @lengthDistribution
	 *        that describes min/max lengths and averages.
	 */
  constructor(distinctName: string, type: TypeDescriptor | DbRef | Dictionary, public categoryProperty: DbRef | null) {
    super(distinctName, null);
		this.type = TypeHelper.convert(type);
		if (!distinctName.match(/^[a-z]/))
			throw Error('By convention, all MixinProperty names must begin with a lower-case letter. Illegal name: ' + distinctName);
  }
  
  getSerializationProperties(): Object {
    return {distinctName: this.distinctName, type: this.type};
  }

  static create_jel_mapping = {distinctName: 1, type: 2, categoryProperty: 3};
  static create(ctx: Context, ...args: any[]) {
    return new MixinProperty(TypeChecker.realString(args[0], 'distinctName'), 
                             (args[1] instanceof TypeDescriptor || args[1] instanceof Dictionary) ? args[1] : (TypeChecker.dbRef(args[1], 'type') as DbRef), 
                             TypeChecker.optionalDbRef(args[2], 'categoryProperty') as DbRef|null);
  }
}

MixinProperty.prototype.JEL_PROPERTIES = {distinctName: true, type: true, categoryProperty: true};



