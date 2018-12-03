import PackageContent from './PackageContent';
import DbEntry from '../DbEntry';
import DbRef from '../DbRef';
import Context from '../../jel/Context';
import List from '../../jel/types/List';
import Dictionary from '../../jel/types/Dictionary';
import EnumValue from '../../jel/types/EnumValue';
import JelString from '../../jel/types/JelString';
import TypeChecker from '../../jel/types/TypeChecker';


function createProperties(distinctName: string, values: List): Dictionary {
	const d = new Map<string,any>();
	const ref = new DbRef(distinctName);
	values.elements.map(JelString.toRealString).forEach(v=>d.set(v, new EnumValue(v, ref)));
	return new Dictionary(d, true);
}

// Base class for enum definitions.
export default class Enum extends PackageContent {
  JEL_PROPERTIES: Object;
  
	/**
	 * @param values a List of strings with the possible values of the enum
	 */
  constructor(distinctName: string, public values: List) {
    super(distinctName, createProperties(distinctName, values));
		if (!distinctName.endsWith('Enum'))
			throw Error('By convention, all Enum names must end with "Enum". Illegal name: ' + distinctName);
  }

  getSerializationProperties(): Object {
    return [this.distinctName, this.values, this.reality, this.hashCode];
  }

  static create_jel_mapping = ['distinctName', 'values'];
  static create(ctx: Context, ...args: any[]) {
    return new Enum(TypeChecker.realString(args[0], 'distinctName'), 
                    TypeChecker.instance(List, args[1], 'values'));
  }
}

Enum.prototype.JEL_PROPERTIES = {values: true, packageName: true};


