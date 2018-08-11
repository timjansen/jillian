import DbEntry from '../DbEntry';
import DbRef from '../DbRef';
import DatabaseSession from '../DbSession';
import DbIndexDescriptor from '../DbIndexDescriptor';
import Dictionary from '../../jel/types/Dictionary';
import List from '../../jel/types/List';
import Context from '../../jel/Context';


const DB_INDICES: Map<string, DbIndexDescriptor> = new Map();
DB_INDICES.set('subCategories', {type: 'category', property: 'superCategory', includeParents: true});

export default class Category extends DbEntry {
  superCategory: DbRef;
  JEL_PROPERTIES: Object;
	
  
	/**
	 * Creates a new Category 
	 * @param instanceDefaults a dictionary (name->any) of default values for Things of this category. 
	 * @param instanceProperties a dictionary (name->EnumValue of @PropertyTypeEnum) to define required and optional properties.
	 */
  constructor(distinctName: string, superCategory: Category|DbRef, reality?: DbRef, hashCode?: string, properties?: Dictionary, 
							 public instanceDefaults = new Dictionary(),
							 public instanceProperties = new Dictionary()) {
    super(distinctName, reality, hashCode, properties);
		if (!distinctName.endsWith('Category'))
			throw Error('By convention, all Category names must end with "Category". Illegal name: ' + distinctName);

    this.superCategory = DbRef.create(superCategory); 
  }

  // returns promise with all matching objects
  getInstances(ctx: Context, filterFunc: (o: DbEntry)=>boolean): Promise<Category[]> {
    return DbRef.getSession(ctx).getByIndex(this, 'catEntries', filterFunc) as Promise<Category[]>;
  }

  get databaseIndices(): Map<string, DbIndexDescriptor> {
    return DB_INDICES;
  }
  
  getSerializationProperties(): Object {
    return [this.distinctName, this.superCategory, this.reality, this.hashCode, this.properties, this.instanceDefaults];
  }
    
  static create_jel_mapping = {distinctName: 0, superCategory: 1, reality: 2, hashCode: 3, properties: 4, instanceDefaults: 5};
  static create(...args: any[]): any {
    return new Category(args[0], args[1], args[2], args[3], args[4]);
  }
}

Category.prototype.JEL_PROPERTIES = {superCategory: true};

