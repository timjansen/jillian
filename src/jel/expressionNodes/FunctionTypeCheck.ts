import JelNode from './JelNode';
import BaseTypeRegistry from '../BaseTypeRegistry';
import JelObject from '../JelObject';
import Context from '../Context';
import Util from '../../util/Util';
import SourcePosition from '../SourcePosition';
import TypeDescriptor from '../types/typeDescriptors/TypeDescriptor';

/**
 * JelNode to execute a type check for functions/methods.
 */ 
export default class FunctionTypeCheck extends JelNode {
	private typeHelper: any;	
  
  constructor(token: SourcePosition, public expression: JelNode, public type: TypeDescriptor) {
    super(token, [expression]);
  }

  executeImpl(ctx: Context): JelObject|null|Promise<JelObject|null> {
    return Util.resolveValue(this.expression.execute(ctx), val=>this.type.convert(ctx, val));
  }  
  
  // overrride
  equals(other?: JelNode): boolean {
		return other instanceof FunctionTypeCheck &&
      this.expression.equals(other.expression);
	}
  
	toString(): string {
		return this.expression.toString();
  }
  
  isStatic(ctx: Context): boolean {
    return this.expression.isStatic(ctx);
  }
  flushCache(): void {
    this.expression.flushCache();
  }
}

