import JelNode from './JelNode';
import NativeFunction from './NativeFunction';
import Lambda from './Lambda';
import JelObject from '../JelObject';
import Callable from '../Callable';
import Context from '../Context';
import CachableJelNode from './CachableJelNode';
import Serializable from '../Serializable';
import BaseTypeRegistry from '../BaseTypeRegistry';
import Util from '../../util/Util';

/**
 * Represents a method in a class.
 */
export default class MethodDef extends CachableJelNode {
  constructor(public name: string, public expression: Lambda|NativeFunction, public isOverride: boolean, public isNative: boolean, public isStaticMethod: boolean, public isAbstract: boolean, public isGetter: boolean) {
    super();
  }
  
  // override
  executeUncached(ctx: Context): JelObject|Promise<JelObject> {
    return Util.resolveValue(this.expression.execute(ctx), callable=>BaseTypeRegistry.get('Method').valueOf(this.name, callable, this.isNative, this.isStaticMethod, this.isAbstract, this.isOverride, this.isGetter));
  }
  
  // override
  isStaticUncached(ctx: Context): boolean {
    return this.expression.isStatic(ctx);
  }
  
  // override
  equals(other?: JelNode): boolean {
		if (!(other instanceof MethodDef))
			return false;
		return this.name == other.name && 
      this.expression.equals(other.expression) &&
      this.isOverride == other.isOverride &&
      this.isNative == other.isNative &&
      this.isStaticMethod == other.isStaticMethod &&
      this.isGetter == other.isGetter;
	}

	toString(): string {
    if (this.isNative || this.isAbstract)
      return `${this.isStaticMethod?'static ':''}${this.isAbstract?'abstract ':''}${this.isOverride?'override ':''}${this.isNative?'native ':''}${this.isGetter?'get ':''}${this.name}${this.expression.toArgumentString()}${this.expression.toReturnString()}`;
    else
      return `${this.isStaticMethod?'static ':''}${this.isOverride?'override ':''} ${this.isGetter?'get ':''}${this.name}${this.expression.toArgumentString()}${this.expression.toReturnString()}${this.expression.toBodyString()}`;
	}
  
}

