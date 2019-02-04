import JelObject from '../JelObject';
import Context from '../Context';
import BaseTypeRegistry from '../BaseTypeRegistry';
import Enum from './Enum';
import JelBoolean from './JelBoolean';
import JelString from './JelString';
import NativeJelObject from './NativeJelObject';
import Class from './Class';
import TypeChecker from './TypeChecker';
import Util from '../../util/Util';

/**
 * Represents the value of an Enumeration.
 */
export default class EnumValue extends NativeJelObject {
	
  value_jel_property: boolean;
  parent_jel_property: boolean;
  
  static clazz: Class|undefined;

  constructor(public value: string, public parent: Enum) {
		super('EnumValue');
    if (!/^[_a-zA-Z][_a-zA-Z0-9]*$/.test(value))
      throw new Error(`Illegal property value name "${value}", does not follow identifier rules`);
	}
  
  get clazz(): Class {
    return EnumValue.clazz!;
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
		return [this.value, this.parent.distinctName];
	}
	
  toString(): string {
    return `${this.parent.distinctName}.${this.value}`;
  }
  
  serializeToString(pretty: boolean, indent: number, spaces: string) : string {
		return this.toString();
	}

}

EnumValue.prototype.value_jel_property = true;
EnumValue.prototype.parent_jel_property = true;
BaseTypeRegistry.register('EnumValue', EnumValue);
