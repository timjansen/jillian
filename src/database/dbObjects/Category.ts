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
import TypeDescriptor from '../../jel/types/typeDescriptors/TypeDescriptor';
import MixinProperty from './MixinProperty';


const DB_INDICES: Map<string, DbIndexDescriptor> = new Map();
DB_INDICES.set('subCategories', {type: 'category', property: 'superCategory', includeParents: true});

const MAX_VALIDATION_ERRORS = 20;

export default class Category extends DbEntry {
  superCategory_jel_property: boolean;
  factTypes_jel_property: boolean;
  facts_jel_property: boolean;
  mixins_jel_property: boolean;
  
  superCategory: DbRef | null;
  localFactTypesCache: Dictionary | Promise<Dictionary> | undefined;
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
							facts = new Dictionary(),
              public mixins = new List(),
              public reality?: DbRef) {
    super('Category', distinctName, facts);

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

  localFactTypes_jel_mapping: Object;
  localFactTypes(ctx: Context): Dictionary | Promise<Dictionary> {
    if (this.localFactTypesCache)
      return this.localFactTypesCache;
  
    const dct = this.factTypes.mapJs((k, v)=>TypeHelper.convertNullableFromAny(v, k));
    if (this.mixins.isEmpty) {
      this.localFactTypesCache = dct;
      return dct;
    }

    this.localFactTypesCache = Util.resolveArray(this.mixins.elements.map(e=>e.get(ctx)), (mx: MixinProperty[])=>{
      mx.forEach(m=> {
        if (dct.elements.has(m.distinctName))
          throw new Error(`Error in Category @${this.distinctName}: fact type ${m.distinctName} is defined both as category fact and as MixinProperty.`);
        else
          dct.elements.set(m.distinctName, m.type);
      });
      return dct;
    });
    if (this.localFactTypesCache instanceof Promise)
      this.localFactTypesCache.then(r=>this.localFactTypesCache = r);
    return this.localFactTypesCache!;
  }
  
  allFactTypes_jel_mapping: Object;
  allFactTypes(ctx: Context): Dictionary | Promise<Dictionary> {
    if (this.superCategory)
      return this.superCategory.with(ctx, (cat: Category)=>Util.resolveValues((superAll: any, localFactTypes: any)=>superAll.setAllJs(localFactTypes), cat.allFactTypes(ctx), this.localFactTypes(ctx)));
    else
      return this.localFactTypes(ctx);
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
  
  validate(ctx: Context): Promise<any>|any {
    return Util.resolveValue(this.allFactTypes(ctx), factTypes=>
        this.withMember(ctx, 'validateFacts', callable=>Util.resolveValue(callable.invoke(this, factTypes, JelString.valueOf(`@${this.distinctName}`)), (errors: List)=>{
          if (errors.length == 1)
            throw new Error(errors.elements[0].value);
          else if (errors.length > 1)
            throw new Error(`Found ${errors.length > MAX_VALIDATION_ERRORS ? '>'+MAX_VALIDATION_ERRORS : errors.length}} fact validation errors in @${this.distinctName}:\n${errors.elements.slice(0, MAX_VALIDATION_ERRORS).map(e=>e.value).join('\n----------\n')}`);
        else
            return true;
        })));
  }
	
  getSerializationProperties(): any[] {
		return [this.distinctName, this.superCategory, this.factTypes, this.facts, this.mixins, this.reality];
  }
    
  static create_jel_mapping = true;
  static create(ctx: Context, ...args: any[]): any {
    return new Category(TypeChecker.realString(args[0], 'distinctName'), 
                        TypeChecker.optionalInstance(DbRef, args[1], 'superCategory') || undefined, 
                        TypeChecker.instance(Dictionary, args[2], 'factTypes', Dictionary.empty), 
                        TypeChecker.instance(Dictionary, args[3], 'facts', Dictionary.empty), 
                        TypeChecker.instance(List, args[4], 'mixins', List.empty), 
                        (TypeChecker.optionalDbRef(args[5], 'reality')||undefined) as any);
  }
}

Category.prototype.allFactTypes_jel_mapping = true;
Category.prototype.localFactTypes_jel_mapping = true;
Category.prototype.isExtending_jel_mapping = true;
Category.prototype.superCategory_jel_property = true;
Category.prototype.factTypes_jel_property = true;
Category.prototype.facts_jel_property = true;
Category.prototype.mixins_jel_property = true;

BaseTypeRegistry.register('Category', Category);


