import DbEntry from '../DbEntry';
import DbRef from '../DbRef';
import DbSession from '../DbSession';
import PropertyHelper from '../dbProperties/PropertyHelper';
import DbIndexDescriptor from '../DbIndexDescriptor';
import Dictionary from '../../jel/types/Dictionary';
import JelObject from '../../jel/JelObject';
import List from '../../jel/types/List';
import FuzzyBoolean from '../../jel/types/FuzzyBoolean';
import JelString from '../../jel/types/JelString';
import EnumValue from '../../jel/types/EnumValue';
import Context from '../../jel/Context';
import Util from '../../util/Util';


const DB_INDICES: Map<string, DbIndexDescriptor> = new Map();
DB_INDICES.set('subCategories', {type: 'category', property: 'superCategory', includeParents: true});

export default class Category extends DbEntry {
  superCategory: DbRef | null;
	instanceProperties = new Dictionary(); // name->List of PropertyType
  JEL_PROPERTIES: Object;
  
	/**
	 * Creates a new Category.
	 * @param instanceDefaults a dictionary (name->any) of default values for Things of this category. 
	 * @param instanceProperties a dictionary (name->list of PropertyType) to define category properties.
	 *                           Allows shortcuts, see DictionaryPropertyType.
	 * @param mixinProperties a dictionary (name->EnumValue of @PropertyTypeEnum) to define required and optional mixin 
	 *    properties for Things.
	 */
  constructor(distinctName: string, superCategory?: Category|DbRef, properties?: Dictionary, 
							 public instanceDefaults = new Dictionary(),
							 instanceProperties = new Dictionary(),
							 public mixinProperties = new Dictionary(),
							 reality?: DbRef, hashCode?: string) {
    super(distinctName, reality, hashCode, properties);
		if (!distinctName.endsWith('Category'))
			throw Error('By convention, all Category names must end with "Category". Illegal name: ' + distinctName);

    this.superCategory = superCategory ? (superCategory instanceof DbRef ? superCategory : new DbRef(superCategory)) : null; 
		instanceProperties.elements.forEach((value, key)=>this.instanceProperties.elements.set(key, PropertyHelper.convert(value as JelObject) as JelObject));
  }

  // returns promise with all matching objects
  getInstances(ctx: Context, filterFunc: (o: DbEntry)=>boolean): Promise<Category[]> {
    return (ctx.getSession() as DbSession).getByIndex(this, 'catEntries', filterFunc) as Promise<Category[]>;
  }

  get databaseIndices(): Map<string, DbIndexDescriptor> {
    return DB_INDICES;
  }
	
	member(ctx: Context, name: string, parameters?: Map<string, any>): any {
		const v = super.member(ctx, name, parameters);
		if (v === undefined && this.superCategory)
			return Util.resolveValue(this.superCategory.get(ctx), (c: any)=>c.member(ctx, name, parameters));
		else
			return v;
	}

	instanceDefault(ctx: Context, name: string, parameters?: Map<string, any>): any {
		if (this.instanceDefaults.elements.has(name)) {
			return this.instanceDefaults.elements.get(name);
		}
		else if (this.superCategory)
			return Util.resolveValue(this.superCategory.get(ctx), (c: any)=>c.instanceDefault(ctx, name, parameters));
		else
			return null;
	}

	instanceProperty(ctx: Context, name: string): EnumValue | Promise<EnumValue> | null {
		if (this.instanceProperties.elements.has(name))
			return this.instanceProperties.elements.get(name) as EnumValue | Promise<EnumValue>;
		else if (this.superCategory)
			return Util.resolveValue(this.superCategory.get(ctx), (c: any)=>c.instanceProperty(ctx, name));
		else
			return null;
	}

	isExtending_jel_mapping: Object;
	isExtending(ctx: Context, otherCategory: string | JelString |DbRef): FuzzyBoolean | Promise<FuzzyBoolean> {
		if (otherCategory instanceof DbRef)
			return this.isExtending(ctx, otherCategory.distinctName);
		if (otherCategory instanceof JelString)
			return this.isExtending(ctx, otherCategory.value);
		if (!this.superCategory)
			return FuzzyBoolean.FALSE;
		return this.superCategory.distinctName == otherCategory ? FuzzyBoolean.TRUE : (this.superCategory.with(ctx, (s: Category) =>s.isExtending(ctx, otherCategory)) as  FuzzyBoolean | Promise<FuzzyBoolean>);
	}
	
  getSerializationProperties(): Object {
		return [this.distinctName, this.superCategory, this.properties, this.instanceDefaults, this.instanceProperties, this.mixinProperties, this.reality, this.hashCode];
  }
    
  static create_jel_mapping = {distinctName: 1, superCategory: 2, properties: 3, 
															 instanceDefaults: 4, instanceProperties: 5, mixinProperties: 6, 
															 reality: 7, hashCode: 8};
  static create(ctx: Context, ...args: any[]): any {
    return new Category(JelString.toRealString(args[0]), args[1], args[2], args[3], args[4], args[5], args[6], JelString.toRealString(args[7]));
  }
}

Category.prototype.JEL_PROPERTIES = {superCategory: true};
Category.prototype.isExtending_jel_mapping = {category: 1}


