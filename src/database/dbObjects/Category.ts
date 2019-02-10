import DbEntry from '../DbEntry';
import DbRef from '../DbRef';
import DbSession from '../DbSession';
import TypeHelper from '../../jel/types/typeDescriptors/TypeHelper';
import DbIndexDescriptor from '../DbIndexDescriptor';
import Dictionary from '../../jel/types/Dictionary';
import JelObject from '../../jel/JelObject';
import Class from '../../jel/types/Class';
import List from '../../jel/types/List';
import JelBoolean from '../../jel/types/JelBoolean';
import JelString from '../../jel/types/JelString';
import EnumValue from '../../jel/types/EnumValue';
import TypeChecker from '../../jel/types/TypeChecker';
import Context from '../../jel/Context';
import Util from '../../util/Util';
import BaseTypeRegistry from '../../jel/BaseTypeRegistry';


const DB_INDICES: Map<string, DbIndexDescriptor> = new Map();
DB_INDICES.set('subCategories', {type: 'category', property: 'superCategory', includeParents: true});

export default class Category extends DbEntry {
  superCategory_jel_property: boolean;
  instanceProperties_jel_property: boolean;
  instanceDefaults_jel_property: boolean;
  mixinProperties_jel_property: boolean;
  
  superCategory: DbRef | null;
	instanceProperties = new Dictionary(); // name->List of PropertyType
  static clazz: Class|undefined;

	/**
	 * Creates a new Category.
	 * @param instanceDefaults a dictionary (name->any) of default values for Things of this category. 
	 * @param instanceProperties a dictionary (name->list of PropertyType) to define category properties.
	 *                           Allows shortcuts, see TypeHelper.
	 * @param mixinProperties a dictionary (name->EnumValue of @PropertyTypeEnum) to define required and optional mixin 
	 *    properties for Things.
	 */
  constructor(distinctName: string, superCategory?: Category|DbRef, properties?: Dictionary, 
							 public instanceDefaults = new Dictionary(),
							 instanceProperties = new Dictionary(),
							 public mixinProperties = new Dictionary(),
							 reality?: DbRef, hashCode?: string) {
    super('Category', distinctName, reality, hashCode, properties);
		if (!distinctName.endsWith('Category'))
			throw new Error('By convention, all Category names must end with "Category". Illegal name: ' + distinctName);

    this.superCategory = superCategory ? (superCategory instanceof DbRef ? superCategory : new DbRef(superCategory)) : null; 
		instanceProperties.elements.forEach((value, key)=>this.instanceProperties.elements.set(key, TypeHelper.convertFromAny(value, key)));
  }
  
  get clazz(): Class {
    return Category.clazz!;
  }  


  // returns promise with all matching objects
  getInstances(ctx: Context, filterFunc: (o: DbEntry)=>boolean): Promise<Category[]> {
    return (ctx.getSession() as DbSession).getByIndex(this, 'catEntries', filterFunc) as Promise<Category[]>;
  }

  get databaseIndices(): Map<string, DbIndexDescriptor> {
    return DB_INDICES;
  }
	
	member(ctx: Context, name: string): any {
		const v = super.member(ctx, name);
		if (v === undefined && this.superCategory)
			return Util.resolveValue(this.superCategory.get(ctx), (c: any)=>c.member(ctx, name));
		else
			return v;
	}

	instanceDefault(ctx: Context, name: string): any {
		if (this.instanceDefaults.elements.has(name)) {
			return this.instanceDefaults.elements.get(name);
		}
		else if (this.superCategory)
			return Util.resolveValue(this.superCategory.get(ctx), (c: any)=>c.instanceDefault(ctx, name));
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
	
  getSerializationProperties(): any[] {
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

Category.prototype.isExtending_jel_mapping = {category: 1}
Category.prototype.superCategory_jel_property = true;
Category.prototype.instanceProperties_jel_property = true;
Category.prototype.instanceDefaults_jel_property = true;
Category.prototype.mixinProperties_jel_property = true;

BaseTypeRegistry.register('Category', Category);


