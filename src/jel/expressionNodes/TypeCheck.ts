import JelNode from './JelNode';
import CachableJelNode from './CachableJelNode';
import JelObject from '../JelObject';
import Context from '../Context';
import Util from '../../util/Util';
import SourcePosition from '../SourcePosition';

/**
 * Common node for 'as' and 'instanceof'
 */ 
export default abstract class TypeCheck extends CachableJelNode {
	
  constructor(position: SourcePosition, public left: JelNode, public right: JelNode) {
    super(position, [left, right]);
  }

  abstract executeTypeCheck(ctx: Context, left: JelObject|null, right: JelObject|null): JelObject|null|Promise<JelObject|null>;
  
  isStaticUncached(ctx: Context): boolean {
    return this.left.isStatic(ctx) && this.right.isStatic(ctx);
  }
  
  flushCache(): void {
    super.flushCache();
    this.left.flushCache();
    this.right.flushCache();
  }
  
  executeUncached(ctx: Context): JelObject|null|Promise<JelObject|null> {
    return Util.resolveValues((l: any, r: any)=>this.executeTypeCheck(ctx, l, r), this.left.execute(ctx), this.right.execute(ctx));
  }

}

