import Category from './Category';
import DbRef from '../DbRef';
import Context from '../../jel/Context';
import DbEntry from '../DbEntry';
import Class from '../../jel/types/Class';
import TypeDescriptor from '../../jel/types/typeDescriptors/TypeDescriptor';
import TypeHelper from '../../jel/types/typeDescriptors/TypeHelper';
import DbIndexDescriptor from '../DbIndexDescriptor';
import Dictionary from '../../jel/types/Dictionary';
import TypeChecker from '../../jel/types/TypeChecker';
import List from '../../jel/types/List';
import JelString from '../../jel/types/JelString';
import BaseTypeRegistry from '../../jel/BaseTypeRegistry';


/**
 * Defines a property used by several categories, e.g. @size or @dimensions or @firstName
 */
export default class MixinProperty extends DbEntry {
  type_jel_property: boolean;
  typeDef_jel_property: boolean;
  public type: TypeDescriptor;
  static clazz: Class|undefined;

  
	/**
	 * Creates a new instance.
	 * @param distinctName the mixin property name. Must start with lower-case letter.
	 * @param typeDef the TypeDescriptor that describes the allowed values. 
	 */
  constructor(distinctName: string, public typeDef: any) {
    super('MixinProperty', distinctName);
		this.type = TypeHelper.convertFromAny(typeDef, 'typeDef');
		if (!distinctName.match(/^[a-z]/))
			throw Error('By convention, all MixinProperty names must begin with a lower-case letter. Illegal name: ' + distinctName);
  }
  
  get clazz(): Class {
    return MixinProperty.clazz!;
  }  
  
  getSerializationProperties(): any[] {
    return [this.distinctName, this.type];
  }

  static create_jel_mapping = true;
  static create(ctx: Context, ...args: any[]) {
    return new MixinProperty(TypeChecker.realString(args[0], 'distinctName'), 
                             (args[1] instanceof TypeDescriptor || args[1] instanceof Dictionary) ? args[1] : (TypeChecker.dbRef(args[1], 'type') as DbRef));
  }
}

MixinProperty.prototype.type_jel_property = true;
MixinProperty.prototype.typeDef_jel_property = true;


BaseTypeRegistry.register('MixinProperty', MixinProperty);


