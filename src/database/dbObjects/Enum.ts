import DbEntry from '../DbEntry';
import DbRef from '../DbRef';
import List from '../../jel/types/List';
import EnumValue from '../../jel/types/EnumValue';

// Base class for enum definitions.
export default class Enum extends DbEntry {
  JEL_PROPERTIES: Object;
  
	/**
	 * @param values a List of strings with the possible values of the enum
	 */
  constructor(distinctName: string, public values: List, reality: DbRef, hashCode: string) {
    super(distinctName, reality, hashCode);
		if (!distinctName.endsWith('Enum'))
			throw Error('By convention, all Enum names must end with "Enum". Illegal name: ' + distinctName);

		const ref = DbRef.create(distinctName);
		values.elements.forEach(v=>this.set(v, new EnumValue(v, ref)));
  }

  getSerializationProperties(): Object {
    return [this.distinctName, this.values, this.reality, this.hashCode];
  }

  static create_jel_mapping = {distinctName: 0, values: 1, reality: 2, hashCode: 3};
  static create(...args: any[]) {
    return new Enum(args[0], args[1], args[2], args[3]);
  }
}

Enum.prototype.JEL_PROPERTIES = {values: true};


