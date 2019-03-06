import Category from './Category';
import Context from '../../jel/Context';
import NamedObject from '../../jel/types/NamedObject';
import Class from '../../jel/types/Class';
import TypeDescriptor from '../../jel/types/typeDescriptors/TypeDescriptor';
import TypeHelper from '../../jel/types/typeDescriptors/TypeHelper';
import Dictionary from '../../jel/types/Dictionary';
import TypeChecker from '../../jel/types/TypeChecker';
import List from '../../jel/types/List';
import JelString from '../../jel/types/JelString';
import BaseTypeRegistry from '../../jel/BaseTypeRegistry';


/**
 * Defines a set of default values for a Thing.
 */
export default class DefaultProperties extends NamedObject {
  facts_jel_property: boolean;
  static clazz: Class|undefined;


	/**
	 * Creates a new instance.
	 * @param distinctName the properties default name. Must start with lower-case letter.
	 * @param facts a Dictionary of values
	 */
  constructor(distinctName: string, public facts: Dictionary) {
    super('DefaultProperties', distinctName);
		if (!distinctName.match(/^[a-z]/))
			throw Error('By convention, all DefaultProperties names must begin with a lower-case letter. Illegal name: ' + distinctName);
  }
  
  get clazz(): Class {
    return DefaultProperties.clazz!;
  }  
  
  getSerializationProperties(): any[] {
    return [this.distinctName, this.facts];
  }

  static create_jel_mapping = true;
  static create(ctx: Context, ...args: any[]) {
    return new DefaultProperties(TypeChecker.realString(args[0], 'distinctName'), TypeChecker.instance(Dictionary, args[1], 'facts'));
  }
}

DefaultProperties.prototype.facts_jel_property = true;

BaseTypeRegistry.register('DefaultProperties', DefaultProperties);


