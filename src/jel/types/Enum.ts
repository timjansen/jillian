import PackageContent from './PackageContent';
import Context from '../Context';
import List from './List';
import Dictionary from './Dictionary';
import EnumValue from './EnumValue';
import JelString from './JelString';
import TypeChecker from './TypeChecker';


function createProperties(ctx: Context, distinctName: string, values: List): Dictionary {
	const d = new Map<string,any>();
	const ref = ctx.getSession().createDbRef(distinctName);
	values.elements.map(JelString.toRealString).forEach(v=>d.set(v, new EnumValue(v, ref)));
	return new Dictionary(d, true);
}

// Base class for enum definitions.
export default class Enum extends PackageContent {
  JEL_PROPERTIES: Object;
  
	/**
	 * @param values a List of strings with the possible values of the enum.
	 */
  constructor(distinctName: string, public values: List, public valueMap: Dictionary) {
    super(distinctName);
		if (!distinctName.endsWith('Enum'))
			throw Error('By convention, all Enum names must end with "Enum". Illegal name: ' + distinctName);
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
                    TypeChecker.instance(List, args[1], 'values'),
                    createProperties(ctx, args[0], args[1]));
  }
}

Enum.prototype.JEL_PROPERTIES = {values: true, packageName: true, valueMap: true};


