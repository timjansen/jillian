import JelNode from './JelNode';
import CachableJelNode from './CachableJelNode';
import JelObject from '../JelObject';
import Callable from '../Callable';
import Context from '../Context';
import SourcePosition from '../SourcePosition';
import DeclaringStatement from './DeclaringStatement';
import Lambda from './Lambda';


/**
 * Represents a function, which is a named Lambda.
 */
export default class FunctionDef extends CachableJelNode  implements DeclaringStatement {
  isDeclaringStatement = true;

  constructor(position: SourcePosition, public name: string, public lambda: Lambda) {
    super(position, [lambda]);
  }

  // override
  executeUncached(ctx: Context): JelObject|null|Promise<JelObject|null> {
      return this.lambda.execute(ctx);
  }
  
  isStaticUncached(ctx: Context): boolean {
    return this.lambda.isStatic(ctx);
  }
  
  flushCache(): void {
    super.flushCache();
    this.lambda.flushCache();
  }
 
  // override
  equals(other?: JelNode): boolean {
		if (!(other instanceof FunctionDef))
			return false;
		return this.name == other.name && this.lambda.equals(other.lambda);
	}
  
  getSerializationProperties(): Object {
    return [this.name, this.lambda];
  }
	
	toString(): string {
		return `${this.name}${this.lambda.toString()}`;
	}
}

