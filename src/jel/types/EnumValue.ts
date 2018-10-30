import JelObject from '../JelObject';
import Context from '../Context';
import {IDbRef} from '../IDatabase';
import JelBoolean from './JelBoolean';
import JelString from './JelString';

/**
 * Represents the value of an Enumeration.
 */
export default class EnumValue extends JelObject {
	JEL_PROPERTIES: Object = {value: 1, parent: 1};
	
	constructor(public value: string, public parent: IDbRef) {
		super();
	}
	
	op(ctx: Context, operator: string, right: JelObject): JelObject|Promise<JelObject> {
		if (right instanceof EnumValue) {
			switch (operator) {
				case '==': 
				case '===':
					return JelBoolean.valueOf(this.value == right.value && this.parent.distinctName == right.parent.distinctName);
					
				case '!=':
				case '!==':
					return JelBoolean.valueOf(this.value != right.value || this.parent.distinctName != right.parent.distinctName);
			}
		}
		else if (right instanceof JelString)
			return JelString.valueOf(this.value).op(ctx, operator, right);
		return super.op(ctx, operator, right);
	}
	
	getSerializationProperties(): any[] {
		return [this.value, this.parent];
	}
	
	
	static create_jel_mapping = {value: 1, parent: 2 };
	static create(ctx: Context, ...args: any[]): EnumValue {
		return new EnumValue(JelString.toRealString(args[0]), args[1]);
	}
}



