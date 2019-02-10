import JelNode from './JelNode';
import CachableJelNode from './CachableJelNode';
import TypedParameterDefinition from './TypedParameterDefinition';
import JelObject from '../JelObject';
import BaseTypeRegistry from '../BaseTypeRegistry';
import Context from '../Context';
import NativeCallable from '../NativeCallable';
import Util from '../../util/Util';
import SourcePosition from '../SourcePosition';


/**
 * Represents a native function in a class.
 *
 * Examples:
 * native add(a, b)
 */ 
export default class NativeFunction extends CachableJelNode {
 
  constructor(position: SourcePosition, public name: string, public className: string, public isStaticClass: boolean, public args: TypedParameterDefinition[], public returnType?: TypedParameterDefinition, public varArg = false) {
		super(position);
  }
  
	// override
  executeUncached(ctx: Context): JelObject|null|Promise<JelObject|null> {
    const clazz: any = BaseTypeRegistry.get(this.className);
    const impl: any = this.isStaticClass ? clazz : clazz.prototype;
    if (!impl[this.name + '_jel_mapping'])
      throw new Error(`Native method ${this.name}() in class ${this.className} does not have the required ${this.name}_jel_mapping property in the implementation class.`);
    const func = impl[this.name];
    if (!func)
      throw new Error(`Native method ${this.name}() in class ${this.className} has a ${this.name}_jel_mapping, but no implementation.`);
   
    if (this.returnType) {
      const eList = [this.returnType.execute(ctx)].concat(this.args.map(a=>a.execute(ctx)));
      return Util.resolveArray(eList, eListResolved=>new NativeCallable(undefined, eListResolved.slice(1), eListResolved[0], func, ctx, this.name, this.varArg));
    }
    else
      return Util.resolveArray(this.args.map(a=>a.execute(ctx)), args=>new NativeCallable(undefined, args, undefined, func, ctx, this.name, this.varArg));
	}
	
  isStaticUncached(ctx: Context): boolean {
    return true;
  }
  
  flushCache(): void {
    super.flushCache();
    if (this.returnType) this.returnType.flushCache();
    this.args.forEach(a=>a.flushCache());  
  }
  
	// override
  equals(other?: JelNode): boolean {
		return other instanceof NativeFunction &&
			this.name == other.name && 
			this.className == other.className && 
			this.isStaticClass == other.isStaticClass && 
      this.varArg == other.varArg && 
      ((this.returnType==other.returnType) || (!!this.returnType && !!other.returnType && this.returnType.equals(other.returnType))) &&
      this.args.length == other.args.length && 
      !this.args.find((l, i)=>!l.equals(other.args[i]));
	}

	toString(): string {
    if (this.returnType && this.returnType.type)
			return `${this.isStaticClass?'static ':''}native ${this.name}${this.toArgumentString()}: ${this.returnType.type.toString()}`;
		else
			return `${this.isStaticClass?'static ':''}native ${this.name}${this.toArgumentString()}`;
	}

  toBodyString(): string {
    return '';
  }
  
 	toArgumentString(): string {
			return `(${this.args.map(a=>a.toString()).join(', ')})`;
	}

 	toReturnString(): string {
			return (this.returnType && this.returnType.type) ? `:${this.returnType.type.toString()}` : '';
	}
}

