import JelNode from './JelNode';
import Assignment from './Assignment';
import JelObject from '../JelObject';
import Runtime from '../Runtime';
import Callable from '../Callable';
import Context from '../Context';
import Util from '../../util/Util';

function resolveValueObj(f: (e: any)=>any, assignments: Assignment[], values: any[]): any {
	if (!assignments.length)
		return f(null);

	function createObj(l: any[]): Object {
		const o: any = {};
		l.forEach((v, i)=>o[assignments[i].name] = v);
		return o;
	}

	if (values.find(v=>v instanceof Promise))
		return Promise.all(values).then(v=>f(createObj(v)));
	else 
		return f(createObj(values));
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
  
  private callCallable(ctx: Context, callable: Callable): any {
    const args = this.argList.map(a=>a.execute(ctx));
    const argObjValues = this.namedArgs.map(a=>a.execute(ctx));

    return resolveValueObj(objArgs=>Util.resolveArray(args, (listArgs: any[])=>callable.invokeWithObject(ctx, null, listArgs, objArgs)), this.namedArgs, argObjValues);
  }
  
  private callLeft(ctx: Context, left: JelNode): JelObject|null|Promise<JelObject|null> {
    if (left instanceof Callable) 
      return this.callCallable(ctx, left);
    else if (JelObject.isPrototypeOf(left) || left instanceof JelObject) 
      return Util.resolveValue(Runtime.member(ctx, left, 'create'), (callable: any) => {
				if (!callable)
					throw new Error(`Call failed. Tried to create '${left.constructor.name}', but it does not support creation. It needs a public create() method.`);
				return this.callCallable(ctx, callable);
			});
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

