import BaseTypeRegistry from '../BaseTypeRegistry';
import PackageContent from './PackageContent';
import Context from '../Context';
import List from './List';
import Class from './Class';
import Dictionary from './Dictionary';
import EnumValue from './EnumValue';
import JelString from './JelString';
import TypeChecker from './TypeChecker';



// Base class for enum definitions.
export default class Enum extends PackageContent {
  name_jel_property: boolean;
  values_jel_property: boolean;

  public valueMap: Dictionary;
  static clazz: Class|undefined;

  static anonymous: Enum = new Enum('AnonymousEnum', List.empty);

	/**
	 * @param values a List of strings with the possible values of the enum.
	 */
  constructor(public name: string, public values: List) {
    super('Enum', name);

		if (!name.endsWith('Enum'))
			throw Error('By convention, all Enum names must end with "Enum". Illegal name: ' + name);

    const d = new Map<string,any>();
	  values.elements.map(JelString.toRealString).forEach(v=>d.set(v, new EnumValue(v, this)));
	  this.valueMap = new Dictionary(d, true);
  }
  
  get clazz(): Class {
    return Enum.clazz!;
  }  
  
	member(ctx: Context, name: string): any {
		if (this.valueMap.elements.has(name))
			return this.valueMap.get(ctx, name);
    else
      return super.member(ctx, name);
  }
  
  hasJs(name: string): boolean {
    return this.valueMap.elements.has(name);
  }
  
  getSerializationProperties(): any[] {
    return [this.name, this.values];
  }

  static create_jel_mapping = true;
  static create(ctx: Context, ...args: any[]) {
    return new Enum(TypeChecker.realString(args[0], 'name'), 
                    TypeChecker.instance(List, args[1], 'values'));
  }
}

Enum.prototype.name_jel_property = true;
Enum.prototype.values_jel_property = true;

BaseTypeRegistry.register('Enum', Enum);

