import JelNode from './JelNode';
import CachableJelNode from './CachableJelNode';
import JelObject from '../JelObject';
import Callable from '../Callable';
import Context from '../Context';
import BaseTypeRegistry from '../BaseTypeRegistry';
import SourcePosition from '../SourcePosition';
import Util from '../../util/Util';


/**
 * Represents an dynamic assignment, which has a name determined at runtime.
 */
export default class DynamicAssignment extends CachableJelNode   {
  constructor(position: SourcePosition, public name: JelNode, public expression: JelNode) {
    super(position, [name, expression]);
  }

  // override
  executeUncached(ctx: Context): JelObject|null|Promise<JelObject|null> {
      return Util.resolveValues((name: any, value: any)=>{
        const m = new Map();
        m.set(name.value, value);
        return BaseTypeRegistry.get('Dictionary').valueOf(m, true);
      }, this.name.execute(ctx), this.expression.execute(ctx));

      return this.expression.execute(ctx);
  }
  
  isStaticUncached(ctx: Context): boolean {
    return this.expression.isStatic(ctx) && this.name.isStatic(ctx);
  }
  
  flushCache(): void {
    super.flushCache();
    this.name.flushCache();
    this.expression.flushCache();
  }
 
  // override
  equals(other?: JelNode): boolean {
		if (!(other instanceof DynamicAssignment))
			return false;
		return this.name.equals(other.name) && this.expression.equals(other.expression);
	}
  
  getSerializationProperties(): Object {
    return [this.name, this.expression];
  }
	
	toString(separator='='): string {
		return `${this.name.toString()}${separator}${this.expression.toString()}`;
	}
}

