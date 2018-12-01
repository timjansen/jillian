import JelObject from '../JelObject';
import Runtime from '../Runtime';
import BaseTypeRegistry from '../BaseTypeRegistry';
import SerializablePrimitive from '../SerializablePrimitive';
import Context from '../Context';
import Util from '../../util/Util';
import JelBoolean from './JelBoolean';
import TypeChecker from './TypeChecker';

/**
 * Represents a string.
 */
export default class JelString extends JelObject implements SerializablePrimitive {
	JEL_PROPERTIES: Object;
	
	static readonly EMPTY = new JelString("");
	
  static typeName = 'String';
  
	constructor(public value: string) {
		super('String');
	}
	
	op(ctx: Context, operator: string, right: JelObject): JelObject|Promise<JelObject> {
		if (right instanceof JelString) {
			switch (operator) {
				case '+': 
					return JelString.valueOf(this.value + right.value);
				case '==': 
				case '===': 
					return JelBoolean.valueOf(this.value === right.value);
				case '!=': 
				case '!==': 
					return JelBoolean.valueOf(this.value !== right.value);
			};
		}
		else {
			switch (operator) {
				case '+': 
					return JelString.valueOf(this.value + right.toString());
			};
		}
		return super.op(ctx, operator, right);
	}
	
	get length(): number {
		return this.value.length;
	}
	
	trim_jel_mapping: Object;
	trim(): string {
		return this.value.trim();
	}
	
	static valueOf(n: string): JelString {
		return n ? new JelString(n) : JelString.EMPTY;
	}
	
	static toRealString(a: string | JelString): string {
		if (a instanceof JelString)
			return a.value;
		else
			return a;
	}
	
	singleOp(ctx: Context, operator: string): JelObject|Promise<JelObject> {
		switch(operator) {
			case '!':
				return JelBoolean.valueOf(!this.value.length);
		}
		return super.singleOp(ctx, operator);
	}

	getSerializationProperties(): any[] {
		return [this.value];
	}
	
	serializeToString(pretty: boolean, indent: number, spaces: string) : string {
		return JSON.stringify(this.value);
	}
	
	toBoolean(): JelBoolean {
		return JelBoolean.valueOf(!!this.value.length);
	}

	toNumber(): number {
		return this.value.length;
	}
	
	toString(): string {
		return this.serializeToString(true, 0, '');
	}
}

JelString.prototype.JEL_PROPERTIES = {length:1};
JelString.prototype.trim_jel_mapping = [];


BaseTypeRegistry.register('String', JelString);


