import DbEntry from '../DbEntry';
import DbRef from '../DbRef';
import Context from '../../jel/Context';
import List from '../../jel/types/List';
import Dictionary from '../../jel/types/Dictionary';
import EnumValue from '../../jel/types/EnumValue';
import JelString from '../../jel/types/JelString';


function createProperties(distinctName: string, values: List): Dictionary {
	const d = new Map<string,any>();
	const ref = new DbRef(distinctName);
	values.elements.forEach(v=>d.set(v, new EnumValue(v, ref)));
	return new Dictionary(d, true);
}

// Base class for enum definitions.
export default class Enum extends DbEntry {
  JEL_PROPERTIES: Object;
  
	/**
	 * @param values a List of strings with the possible values of the enum
	 */
  constructor(distinctName: string, public values: List, reality: DbRef, hashCode: string) {
    super(distinctName, reality, hashCode, createProperties(distinctName, values));
		if (!distinctName.endsWith('Enum'))
			throw Error('By convention, all Enum names must end with "Enum". Illegal name: ' + distinctName);
  }

  getSerializationProperties(): Object {
    return [this.distinctName, this.values, this.reality, this.hashCode];
  }

  static create_jel_mapping = {distinctName: 1, values: 2, reality: 3, hashCode: 4};
  static create(ctx: Context, ...args: any[]) {
    return new Enum(JelString.toRealString(args[0]), args[1], args[2], JelString.toRealString(args[3]));
  }
}

Enum.prototype.JEL_PROPERTIES = {values: true};


