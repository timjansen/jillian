import JelNode from './JelNode';
import JelType from '../JelType';
import Context from '../Context';
import Gettable from '../Gettable';
import Util from '../../util/Util';


export default class Get extends JelNode {
  constructor(public left: JelNode, public name: JelNode) {
    super();
  }
  
  getValue(ctx: Context, left: JelNode, name: string): any {
    if (left == null)
      return left;
    else if ((left as any).get_jel_mapping)
      return (left as any).get(name);
    else if (name == null)
      return null;
    else 
      return JelType.member(left, name);
  }
   
  // override
  execute(ctx: Context): any {
    return Util.resolveValues((l,n)=>this.getValue(ctx, l, n), this.left.execute(ctx), this.name.execute(ctx));
  }
  
  // override
  equals(other: JelNode): any {
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

