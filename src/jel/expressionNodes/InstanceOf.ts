import JelNode from './JelNode';
import TypeCheck from './TypeCheck';
import BaseTypeRegistry from '../BaseTypeRegistry';
import JelObject from '../JelObject';
import Runtime from '../Runtime';
import TypeHelper from '../types/typeDescriptors/TypeHelper';
import Context from '../Context';
import Util from '../../util/Util';

/**
 * Represents an 'instanceof'
 *
 * Examples:
 *  a instanceof Number
 *  a instanceof @Cat
 *  a instanceof String|Number?
 * 
 */ 
export default class As extends TypeCheck {
		
  constructor(left: JelNode, right: JelNode) {
    super(left, right);
  }

  executeTypeCheck(ctx: Context, left: JelObject|null, right: JelObject|null): JelObject {
    return BaseTypeRegistry.get('Boolean').valueOf(TypeHelper.convertFromAny(right, "'instanceof' right operand").checkType(ctx, left));
  }  
  
  // overrride
  equals(other?: JelNode): boolean {
		return other instanceof As &&
      this.left.equals(other.left) &&
      (!this.right == !other.right) &&
      ((!this.right) || this.right!.equals(other.right));
	}
  
	toString(): string {
		return `(${this.left.toString()} instanceof ${this.right.toString()})`;
	}
}

