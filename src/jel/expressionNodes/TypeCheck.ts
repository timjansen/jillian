import JelNode from './JelNode';
import Variable from './Variable';
import BaseTypeRegistry from '../BaseTypeRegistry';
import JelObject from '../JelObject';
import Runtime from '../Runtime';
import Context from '../Context';
import Util from '../../util/Util';

/**
 * Common node for 'as' and 'instanceof'
 */ 
export default abstract class TypeCheck extends JelNode {
		
  constructor(public left: JelNode, public right: JelNode) {
    super();
  }

  abstract executeTypeCheck(ctx: Context, left: JelObject|null, right: JelObject|null): JelObject|null;
  
  // override
  execute(ctx: Context): JelObject|null|Promise<JelObject|null> {
    return Util.resolveValues((l: any, r: any)=>this.executeTypeCheck(ctx, l, r), this.left.execute(ctx), this.right.execute(ctx));
  }

  getSerializationProperties(): Object {
      return [this.left, this.right];
  }
}

