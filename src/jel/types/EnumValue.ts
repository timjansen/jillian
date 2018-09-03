import JelType from '../JelType';
import Context from '../Context';
import {IDbRef} from '../IDatabase';
import FuzzyBoolean from './FuzzyBoolean';

/**
 * Represents the value of an Enumeration.
 */
export default class EnumValue extends JelType {
	JEL_PROPERTIES: Object = {value: 1, parent: 1};
	
	constructor(public value: string, public parent: IDbRef) {
		super();
	}
	
	op(ctx: Context, operator: string, right: any): any {
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
			return JelType.op(ctx, operator, this.value, right);
		return super.op(ctx, operator, right);
	}
	
	getSerializationProperties(): any[] {
		return [this.value, this.parent];
	}
	
	
	static create_jel_mapping = {value: 1, parent: 2 };
	static create(ctx: Context, ...args: any[]): EnumValue {
		return new EnumValue(args[0], args[1]);
	}
}


