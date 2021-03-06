import JelNode from './JelNode';
import TypeCheck from './TypeCheck';
import JelObject from '../JelObject';
import Context from '../Context';
import Util from '../../util/Util';
import BaseTypeRegistry from '../BaseTypeRegistry';
import SourcePosition from '../SourcePosition';

/**
 * Represents an 'instanceof'
 *
 * Examples:
 *  a instanceof Number
 *  a instanceof @Cat
 *  a instanceof String|Number?
 * 
 */ 
export default class Instanceof extends TypeCheck {
	private typeHelper: any;	

  constructor(position: SourcePosition, left: JelNode, right: JelNode) {
    super(position, left, right);
    this.typeHelper = BaseTypeRegistry.get('TypeHelper');
  }

  executeTypeCheck(ctx: Context, left: JelObject|null, right: JelObject|null): JelObject|Promise<JelObject> {
    return this.typeHelper.convertFromAny(right, "'instanceof' right operand").checkType(ctx, left);
  }  
  
  // overrride
  equals(other?: JelNode): boolean {
		return other instanceof Instanceof &&
      this.left.equals(other.left) &&
      (!this.right == !other.right) &&
      ((!this.right) || this.right!.equals(other.right));
	}
  
	toString(): string {
		return `(${this.left.toString()} instanceof ${this.right.toString()})`;
	}
}

