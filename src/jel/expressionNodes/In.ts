import JelNode from './JelNode';
import CachableJelNode from './CachableJelNode';
import JelObject from '../JelObject';
import Runtime from '../Runtime';
import Context from '../Context';
import BaseTypeRegistry from '../BaseTypeRegistry';
import Util from '../../util/Util';

/**
 * Checks whether the left operand is part of the right-hand range or collection.
 *
 * Examples:
 *    a in 1...10
 *    a in [1, 2, 3]
 */
export default class In extends CachableJelNode {
  falseBool: any;
  constructor(public left: JelNode, public right: JelNode) {
    super();
    this.falseBool = BaseTypeRegistry.get('Boolean').FALSE;
  }
  
  getValue(ctx: Context, left: JelObject|null, right: JelObject|null): JelObject|null|Promise<JelObject|null> {
    if (right == null)
      return this.falseBool;

    const rightCtor = right.constructor.name;

    if (rightCtor == 'Range')
      return (right as any).contains(ctx, left);
    else if (rightCtor == 'List')
     	return (right as any).contains(ctx, left);
    else if (rightCtor == 'Dictionary') {
      if (left == null)
        return this.falseBool;
			else if (left.constructor.name == 'JelString')
      	return (right as any).has(ctx, left);
			else
				throw new Error('in operator [] on Dictionary supports only strings.');
		}
    else 
			throw new Error('in operator only works on Range, List and Dictionary.');
  }
  
  // override
  executeUncached(ctx: Context): JelObject|null|Promise<JelObject|null> {
    return Util.resolveValues((l: any, n: any)=>this.getValue(ctx, l, n), this.left.execute(ctx), this.right.execute(ctx));
  }
  
  isStaticUncached(ctx: Context): boolean {
    return this.left.isStatic(ctx) && this.right.isStatic(ctx);
  }
    
  flushCache(): void {
    super.flushCache();
    this.left.flushCache();
    this.right.flushCache();
  }

  // override
  equals(other?: JelNode): any {
		return other instanceof In &&
      this.right == other.right && 
      this.left.equals(other.left);
	}
	
	toString(): string {
		return `(${this.left.toString()} in ${this.right.toString()})`;
	}
 
}

