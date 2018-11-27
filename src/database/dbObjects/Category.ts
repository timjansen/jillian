import DbEntry from '../DbEntry';
import DbRef from '../DbRef';
import DbSession from '../DbSession';
import TypeHelper from '../../jel/types/typeDescriptors/TypeHelper';
import DbIndexDescriptor from '../DbIndexDescriptor';
import Dictionary from '../../jel/types/Dictionary';
import JelObject from '../../jel/JelObject';
import List from '../../jel/types/List';
import JelBoolean from '../../jel/types/JelBoolean';
import JelString from '../../jel/types/JelString';
import EnumValue from '../../jel/types/EnumValue';
import TypeChecker from '../../jel/types/TypeChecker';
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
		instanceProperties.elements.forEach((value, key)=>this.instanceProperties.elements.set(key, TypeHelper.convertFromAny(value, key)));
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
	isExtending(ctx: Context, otherCategory: string | JelString | DbRef): JelBoolean | Promise<JelBoolean> {
		if (otherCategory instanceof DbRef)
			return this.isExtending(ctx, otherCategory.distinctName);
		if (otherCategory instanceof JelString)
			return this.isExtending(ctx, otherCategory.value);
		if (!this.superCategory)
			return JelBoolean.FALSE;
		return this.superCategory.distinctName == otherCategory ? JelBoolean.TRUE : (this.superCategory.with(ctx, (s: Category) =>s.isExtending(ctx, otherCategory)) as  JelBoolean | Promise<JelBoolean>);
	}
	
  getSerializationProperties(): Object {
		return [this.distinctName, this.superCategory, this.properties, this.instanceDefaults, this.instanceProperties, this.mixinProperties, this.reality, this.hashCode];
  }
    
  static create_jel_mapping = {distinctName: 1, superCategory: 2, properties: 3, 
															 instanceDefaults: 4, instanceProperties: 5, mixinProperties: 6, 
															 reality: 7, hashCode: 8};
  static create(ctx: Context, ...args: any[]): any {
    return new Category(TypeChecker.realString(args[0], 'distinctName'), args[1] instanceof DbRef ? args[1] : TypeChecker.optionalInstance(Category, args[1], 'superCategory') || undefined, 
                        TypeChecker.optionalInstance(Dictionary, args[2], 'properties')||undefined, 
                        TypeChecker.optionalInstance(Dictionary, args[3], 'instanceDefaults')||undefined, 
                        TypeChecker.optionalInstance(Dictionary, args[4], 'instanceProperties')||undefined, 
                        TypeChecker.optionalInstance(Dictionary, args[5], 'mixinProperties')||undefined, 
                        TypeChecker.optionalDbRef(args[6], 'reality') as any||undefined, 
                        TypeChecker.optionalRealString(args[7], 'hashCode')||undefined);
  }
}

Category.prototype.JEL_PROPERTIES = {superCategory: true};
Category.prototype.isExtending_jel_mapping = {category: 1}


