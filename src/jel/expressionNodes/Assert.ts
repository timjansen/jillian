import JelNode from './JelNode';
import CachableJelNode from './CachableJelNode';
import Assignment from './Assignment';
import Context from '../Context';
import BaseTypeRegistry from '../BaseTypeRegistry';
import JelObject from '../JelObject';
import Util from '../../util/Util';
import SourcePosition from '../SourcePosition';


/**
 * Defines one or more assertions for the following expression. If an assertion does not return true, an exception will be thrown.
 * 
 * Examples:
 *   assert a in 1...10: a+1
 *   assert a > b, a+b < c, c!=0: a+b/c
 */
export default class Assert extends CachableJelNode {
  bool: any;
  constructor(position: SourcePosition, public assertions: JelNode[], public expression: JelNode) {
    super(position, assertions.concat(expression));
    this.bool = BaseTypeRegistry.get('Boolean');
  }
  
  // override
  executeUncached(ctx:Context): JelObject|null|Promise<JelObject|null> {
    const openPromises: any[] = [];
    this.assertions.forEach(a => {
      const r = a.execute(ctx);
      if (r instanceof Promise)
        openPromises.push(r.then(p=>{if (!this.bool.toRealBoolean(p)) throw new Error('Failed assertion: ' + a.toString());return p;}));
      else if (!this.bool.toRealBoolean(r))
        throw new Error('Failed assertion: ' + a.toString());
    });
    
    return Util.resolveArray(openPromises, promises=>this.expression.execute(ctx));
  }
  
  isStaticUncached(ctx: Context): boolean {
    return this.expression.isStatic(ctx) && !this.assertions.find(a=>!a.isStatic(ctx));
  }

  flushCache(): void {
    super.flushCache();
    this.expression.flushCache();
    this.assertions.forEach(a=>a.flushCache());
  }
  
  // override
  equals(other?: JelNode): boolean {
		return (other instanceof Assert) &&
			this.expression.equals(other.expression) && 
      this.assertions.length == other.assertions.length && 
      !this.assertions.find((l, i)=>!l.equals(other.assertions[i]));
	}
  
	toString(): string {
		return `assert ${this.assertions.map(s=>s.toString()).join(', ')}: ${this.expression.toString()}`;		
	}
}

