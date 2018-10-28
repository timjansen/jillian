import JelNode from './JelNode';
import JelObject from '../JelObject';
import Runtime from '../Runtime';
import Context from '../Context';
import Util from '../../util/Util';

/**
 * Accesses a member of an object for reading. Please note that this node is only used for accessing using '[]', not using '.'.
 *
 * Examples:
 *    a['x']
 *    a['execute']()
 */
export default class Get extends JelNode {
  constructor(public left: JelNode, public name: JelNode) {
    super();
  }
  
  getValue(ctx: Context, left: JelNode, name: JelNode): JelObject|null|Promise<JelObject|null> {
    if (left == null)
      return left;

		const leftCtor = left.constructor.name;
		const nameCtor = name.constructor.name;
    if (leftCtor == 'List') {
			if (nameCtor == 'JelNumber')
      	return (left as any).get(ctx, (name as any).value);
			else
				throw new Error('Index operator [] on List supports only numbers.');
		}
    else if (leftCtor == 'Dictionary') {
			if (nameCtor == 'JelString')
      	return (left as any).get(ctx, (name as any).value);
			else
				throw new Error('Index operator [] on Dictionary supports only strings.');
		}
    else {
			if (nameCtor == 'JelString')
	      return Runtime.member(ctx, left, (name as any).value);
			else
				throw new Error('Index operator [] on objects supports only strings.');
		}
  }
   
  // override
  execute(ctx: Context): JelObject|null|Promise<JelObject|null> {
    return Util.resolveValues((l: any, n: any)=>{
			if (n != null)
				return this.getValue(ctx, l, n);
			else
				throw new Error('Index operator [ ] supports no nulls.');
		}, this.left.execute(ctx), this.name.execute(ctx));
  }
  
  // override
  equals(other?: JelNode): any {
		return other instanceof Get &&
      this.name == other.name && 
      this.left.equals(other.left);
	}
	
	toString(): string {
		return `${this.left.toString()}[${this.name.toString()}]`;
	}
  
  getSerializationProperties(): any[] {
    return [this.left, this.name];
  }
}

