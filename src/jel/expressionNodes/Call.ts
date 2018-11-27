import JelNode from './JelNode';
import Assignment from './Assignment';
import JelObject from '../JelObject';
import Runtime from '../Runtime';
import Callable from '../Callable';
import Context from '../Context';
import Util from '../../util/Util';

function resolveValueObj(f: (e: Map<string,JelObject|null>|undefined)=>JelObject|null|Promise<JelObject|null>, assignments: Assignment[], values: (JelObject|null|Promise<JelObject|null>)[]): JelObject|null|Promise<JelObject|null> {
	if (!assignments.length)
		return f(undefined);

	function createObj(l: (JelObject|null)[]): Map<string,JelObject|null> {
		const o: Map<string,JelObject|null> = new Map();
		l.forEach((v, i)=>o.set(assignments[i].name, v));
		return o;
	}

	if (values.find(v=>v instanceof Promise))
		return Promise.all(values).then(v=>f(createObj(v)));
	else 
		return f(createObj(values as (JelObject|null)[]));
}

/**
 * Represents a function or constructor call. 
 *
 * Examples: 
 *     LocalDate(2002, 2, 5)
 *     f()
 *     f(2)
 *     f(x = 2)
 *     (()=>4)()                     // calling lambda, returns 4
 */
export default class Call extends JelNode {
  constructor(public left: JelNode, public argList: JelNode[]  = [], public namedArgs: Assignment[] = []) {
    super();
  }
  
  private callCallable(ctx: Context, callable: Callable): JelObject|null|Promise<JelObject|null> {
    const args = this.argList.map(a=>a.execute(ctx));
    if (this.namedArgs.length) {
      const argObjValues = this.namedArgs.map(a=>a.execute(ctx));
      return resolveValueObj(objArgs=>Util.resolveArray(args, (listArgs: (JelObject|null)[])=>callable.invokeWithObject(ctx, undefined, listArgs, objArgs)), this.namedArgs, argObjValues);
    }
    else
      return Util.resolveArray(args, (listArgs: (JelObject|null)[])=>callable.invokeWithObject(ctx, undefined, listArgs));
  }

  private callCreate(ctx: Context, left: any): JelObject|null|Promise<JelObject|null> {
    const args = this.argList.map(a=>a.execute(ctx));
    
    if (this.namedArgs.length) {
      const argObjValues = this.namedArgs.map(a=>a.execute(ctx));
      return resolveValueObj(objArgs=>Util.resolveArray(args, (listArgs: (JelObject|null)[])=>Runtime.callMethod(ctx, left, 'create', listArgs, objArgs)), this.namedArgs, argObjValues);
    }
    else
      return Util.resolveArray(args, (listArgs: (JelObject|null)[])=>Runtime.callMethod(ctx, left, 'create', listArgs));
  }

  
  private callLeft(ctx: Context, left: any): JelObject|null|Promise<JelObject|null> {
    if (left instanceof Callable) 
      return this.callCallable(ctx, left);
    else if (JelObject.isPrototypeOf(left) || left instanceof JelObject) 
      return this.callCreate(ctx, left);
    else 
        throw new Error(`Can not call, not a callable object.`);
  }
  
  // override
  execute(ctx: Context): JelObject|null|Promise<JelObject|null> {
    return Util.resolveValue(this.left.execute(ctx), v=>this.callLeft(ctx, v));
  }
  
  // overrride
  equals(other?: JelNode): boolean {
		return other instanceof Call &&
      this.left.equals(other.left) &&
      this.argList.length == other.argList.length &&
      this.namedArgs.length == other.namedArgs.length && 
      !this.argList.find((l, i)=>!l.equals(other.argList[i])) &&
      !this.namedArgs.find((l, i)=>!l.equals(other.namedArgs[i]));
	}

	toString(): string {
		if (!this.namedArgs.length)
			return `${this.left}(${this.argList.map(s=>s.toString()).join(', ')})`;
		if (!this.argList.length)
			return `${this.left}(${this.namedArgs.map(s=>s.toString()).join(', ')})`;

		return `${this.left}(${this.argList.map(s=>s.toString()).join(', ')}, ${this.namedArgs.map(s=>s.toString()).join(', ')})`;
	}
  
  getSerializationProperties(): Object {
    return {left: this.left, argList: this.argList, namedArgs: this.namedArgs};
  }
}

