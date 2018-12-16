import JelNode from './JelNode';
import TypeCheck from './TypeCheck';
import BaseTypeRegistry from '../BaseTypeRegistry';
import JelObject from '../JelObject';
import Runtime from '../Runtime';
import TypeHelper from '../types/typeDescriptors/TypeHelper';
import Context from '../Context';
import Util from '../../util/Util';

/**
 * Represents an 'As'
 *
 * Examples:
 *  a as Float
 *  a as @Cat
 *  a as String|Float?
 */ 
export default class As extends TypeCheck {
		
  constructor(left: JelNode, right: JelNode, public extraMessage?: string) {
    super(left, right);
  }

  executeTypeCheck(ctx: Context, left: JelObject|null, right: JelObject|null): JelObject|null|Promise<JelObject|null> {
    return TypeHelper.convertFromAny(right, "'as' right operand").convert(ctx, left, this.extraMessage||'');
  }  
  
  // overrride
  equals(other?: JelNode): boolean {
		return other instanceof As &&
      this.left.equals(other.left) &&
      (!this.right == !other.right) &&
      ((!this.right) || this.right!.equals(other.right));
	}
  
	toString(): string {
		return `(${this.left.toString()} as ${this.right.toString()})`;
	}
}

