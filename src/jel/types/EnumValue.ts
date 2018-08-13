import JelType from '../JelType';
import DbRef from '../../database/DbRef';
import FuzzyBoolean from './FuzzyBoolean';

/**
 * Represents the value of an Enumeration.
 */
export default class EnumValue extends JelType {
	public parent: DbRef

	JEL_PROPERTIES: Object = {value:1, parent: 1};
	
	constructor(public value: string, parent: string | DbRef) {
		super();
		this.parent = DbRef.create(parent);
	}
	
	op(operator: string, right: any): any {
		if (right instanceof EnumValue) {
			switch (operator) {
				case '==': 
				case '===':
					return FuzzyBoolean.toFuzzyBoolean(this.value == right.value && this.parent.distinctName == right.parent.distinctName);
					
				case '!=':
				case '!==':
					return FuzzyBoolean.toFuzzyBoolean(this.value != right.value || this.parent.distinctName != right.parent.distinctName);
			}
		}
		else if (typeof right == 'string')
			return JelType.op(operator, this.value, right);
		return super.op(operator, right);
	}
	
	getSerializationProperties(): any[] {
		return [this.value, this.parent];
	}
	
	
	static create_jel_mapping = {value: 0, parent: 1};
	static create(...args: any[]): EnumValue {
		return new EnumValue(args[0], args[1]);
	}
}



