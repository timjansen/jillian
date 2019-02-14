import JelObject from '../JelObject';
import Runtime from '../Runtime';
import BaseTypeRegistry from '../BaseTypeRegistry';
import Class from './Class';
import NativeJelObject from './NativeJelObject';
import SerializablePrimitive from '../SerializablePrimitive';
import Context from '../Context';
import Util from '../../util/Util';
import JelBoolean from './JelBoolean';
import TypeChecker from './TypeChecker';

/**
 * Represents a string.
 */
export default class JelString extends NativeJelObject implements SerializablePrimitive {
	static readonly EMPTY = new JelString("");
  
  static clazz: Class|undefined;

	
  static jelName = 'String';
  
	constructor(public value: string) {
		super('String');
	}
	
  get clazz(): Class {
    return JelString.clazz!;
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
				case '>': 
				case '>>': 
          return JelBoolean.valueOf(this.value > right.value);
				case '<':
        case '<<': 
					return JelBoolean.valueOf(this.value < right.value);
				case '>=': 
				case '>==': 
          return JelBoolean.valueOf(this.value >= right.value);        
				case '<=': 
				case '<==': 
					return JelBoolean.valueOf(this.value <= right.value);
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
	
 	length_jel_property: boolean;
	get length(): number {
		return this.value.length;
	}
	
	trim_jel_mapping: boolean;
	trim(): string {
		return this.value.trim();
	}
  
  contains_jel_mapping: boolean;
	contains(ctx: Context, s0: any): boolean {
    const s = TypeChecker.realString(s0, 's');
		return this.value.includes(s);
	}
  
  startsWith_jel_mapping: boolean;
	startsWith(ctx: Context, s0: any): boolean {
    const s = TypeChecker.realString(s0, 's');
		return this.value.startsWith(s);
	}
  
  endsWith_jel_mapping: boolean;
	endsWith(ctx: Context, s0: any): boolean {
    const s = TypeChecker.realString(s0, 's');
		return this.value.endsWith(s);
	}
  
  get_jel_mapping: boolean;
	get(ctx: Context, index: any): string {
    return this.value.charAt(TypeChecker.realNumber(index, 'index'));
	}

  unicodeAt_jel_mapping: boolean;
	unicodeAt(ctx: Context, index: any): number {
    return this.value.charCodeAt(TypeChecker.realNumber(index, 'index')) || 0;
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
	
  toBoolean_jel_mapping: boolean;
	toBoolean(): JelBoolean {
		return JelBoolean.valueOf(!!this.value.length);
	}

	toFloat(): number {
		return this.value.length;
	}

  toString(): string {
  	return this.value;
	}
}

JelString.prototype.toBoolean_jel_mapping = true;
JelString.prototype.length_jel_property = true;
JelString.prototype.trim_jel_mapping = true;
JelString.prototype.contains_jel_mapping = true;
JelString.prototype.startsWith_jel_mapping = true;
JelString.prototype.endsWith_jel_mapping = true;
JelString.prototype.get_jel_mapping = true;
JelString.prototype.unicodeAt_jel_mapping = true;


BaseTypeRegistry.register('String', JelString);


