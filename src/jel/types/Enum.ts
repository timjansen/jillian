import BaseTypeRegistry from '../BaseTypeRegistry';
import PackageContent from './PackageContent';
import Context from '../Context';
import List from './List';
import Dictionary from './Dictionary';
import EnumValue from './EnumValue';
import JelString from './JelString';
import TypeChecker from './TypeChecker';



// Base class for enum definitions.
export default class Enum extends PackageContent {
  JEL_PROPERTIES: Object;
  public valueMap: Dictionary;
  
	/**
	 * @param values a List of strings with the possible values of the enum.
	 */
  constructor(distinctName: string, public values: List) {
    super(distinctName);

		if (!distinctName.endsWith('Enum'))
			throw Error('By convention, all Enum names must end with "Enum". Illegal name: ' + distinctName);

    const d = new Map<string,any>();
	  values.elements.map(JelString.toRealString).forEach(v=>d.set(v, new EnumValue(v, this)));
	  this.valueMap = new Dictionary(d, true);
  }
  
	member(ctx: Context, name: string, parameters?: Map<string, any>): any {
		if (this.valueMap.elements.has(name))
			return this.valueMap.get(ctx, name);
    else
      return super.member(ctx, name, parameters);
	}
  
  getSerializationProperties(): Object {
    return [this.distinctName, this.values, this.valueMap];
  }

  static create_jel_mapping = ['distinctName', 'values'];
  static create(ctx: Context, ...args: any[]) {
    return new Enum(TypeChecker.realString(args[0], 'distinctName'), 
                    TypeChecker.instance(List, args[1], 'values'));
  }
}

Enum.prototype.JEL_PROPERTIES = {values: true, packageName: true, valueMap: true};

BaseTypeRegistry.register('Enum', Enum);

