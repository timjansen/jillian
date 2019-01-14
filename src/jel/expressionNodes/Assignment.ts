import JelNode from './JelNode';
import CachableJelNode from './CachableJelNode';
import JelObject from '../JelObject';
import Callable from '../Callable';
import Context from '../Context';

class AssignmentCallable extends Callable {
  constructor(private assignment: Assignment) {  
    super();
  }
  
  invokeWithObject(ctx: Context, self: JelObject | undefined, args: (JelObject|null)[], argObj?: Map<String, JelObject|null>): JelObject|null|Promise<JelObject|null> {
    return this.assignment.execute(ctx);    
  }
	
	invoke(ctx: Context, self?: JelObject, ...args: (JelObject|null)[]): JelObject|null|Promise<JelObject|null> {
    return this.assignment.execute(ctx);    
	}
  
  rebind(self: JelObject): Callable {
    return this;
  }
  
  getArguments(): any[] {
    return [];
  }
  
  getReturnType(): any {
    return undefined;
  }
  
  getSerializationProperties(): Object {
    return [this.assignment];
  }

}

/**
 * Represents an assignment, which is a helper construct for with and calls.
 */
export default class Assignment extends CachableJelNode   {
  constructor(public name: string, public expression: JelNode) {
    super();
  }

  // override
  executeUncached(ctx: Context): JelObject|null|Promise<JelObject|null> {
      return this.expression.execute(ctx);
  }
  
  isStaticUncached(ctx: Context): boolean {
    return this.expression.isStatic(ctx);
  }
  
  flushCache(): void {
    super.flushCache();
    this.expression.flushCache();
  }
 
  // override
  equals(other?: JelNode): boolean {
		if (!(other instanceof Assignment))
			return false;
		return this.name == other.name && this.expression.equals(other.expression);
	}
  
  asCallable(): Callable {
    return new AssignmentCallable(this);
  }
  
  getSerializationProperties(): Object {
    return [this.name, this.expression];
  }
	
	toString(separator='='): string {
		return `${this.name}${separator}${this.expression.toString()}`;
	}
}

