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
  factTypes_jel_property: boolean;
  factDefaults_jel_property: boolean;
  mixins_jel_property: boolean;
  
  superCategory: DbRef | null;
  static clazz: Class|undefined;

	/**
	 * Creates a new Category.
	 * @param factTypes a dictionary (name->type definition) to define the facts' base types.
	 *                           Allows shortcuts, see TypeHelper.
	 * @param instanceDefaults a dictionary (name->any) of root default values. Be careful with those and use sparingly, as these are root knowledge.
	 */
  constructor(distinctName: string,
              superCategory?: DbRef|Category,
							public factTypes = new Dictionary(),
							public factDefaults = new Dictionary(),
              public mixins = new List(),
              public reality?: DbRef) {
    super('Category', distinctName);

    if (!distinctName.endsWith('Category'))
			throw new Error('By convention, all Category names must end with "Category". Illegal name: ' + distinctName);

    this.superCategory = superCategory ? (superCategory instanceof DbRef ? superCategory : new DbRef(superCategory)) : null; 
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
		return [this.distinctName, this.superCategory, this.factTypes, this.factDefaults, this.mixins, this.reality];
  }
    
  static create_jel_mapping = true;
  static create(ctx: Context, ...args: any[]): any {
    return new Category(TypeChecker.realString(args[0], 'distinctName'), 
                        TypeChecker.optionalInstance(DbRef, args[1], 'superCategory') || undefined, 
                        TypeChecker.instance(Dictionary, args[2], 'factTypes', Dictionary.empty), 
                        TypeChecker.instance(Dictionary, args[3], 'factDefaults', Dictionary.empty), 
                        TypeChecker.instance(List, args[4], 'mixins', List.empty), 
                        (TypeChecker.optionalDbRef(args[5], 'reality')||undefined) as any);
  }
}

Category.prototype.isExtending_jel_mapping = {category: 1}
Category.prototype.superCategory_jel_property = true;
Category.prototype.factTypes_jel_property = true;
Category.prototype.factDefaults_jel_property = true;
Category.prototype.mixins_jel_property = true;

BaseTypeRegistry.register('Category', Category);


