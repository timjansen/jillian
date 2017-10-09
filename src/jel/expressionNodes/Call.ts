import JelNode from './JelNode';
import Assignment from './Assignment';
import JelType from '../JelType';
import Callable from '../Callable';
import Context from '../Context';
import Util from '../../util/Util';

function resolveValueObj(f: (e: any)=>any, assignments: Assignment[], values: any[]): any {
	if (!assignments.length)
		return f(null);

	function createObj(l: any[]): Object {
		const o = {};
		l.forEach((v, i)=>o[assignments[i].name] = v);
		return o;
	}

	if (values.find(v=>v instanceof Promise))
		return Promise.all(values).then(v=>f(createObj(v)));
	else 
		return f(createObj(values));
}

export default class Call extends JelNode {
  constructor(public left: JelNode, public argList: JelNode[]  = [], public namedArgs: Assignment[] = []) {
    super();
  }
  
  private callCallable(ctx: Context, callable: Callable): any {
    const args = this.argList.map(a=>a.execute(ctx));
    const argObjValues = this.namedArgs.map(a=>a.execute(ctx));

    return resolveValueObj(objArgs=>Util.resolveValues((...listArgs)=>callable.invokeWithObject(listArgs, objArgs, ctx), ...args),
                                this.namedArgs, argObjValues);
  }
  
  private callLeft(ctx: Context, left: JelNode): any {
    if (left instanceof Callable) 
      return this.callCallable(ctx, left);
    else if (JelType.isPrototypeOf(left)) {
      const callable = JelType.member(left, 'create');
      if (!callable)
        throw new Error(`Call failed. Tried to create '${left.constructor.name}', but it does not support creation. It needs a public create() method.`);
      return this.callCallable(ctx, callable);
    }
    else if (left == null) 
      return null;
  }
  
  // override
  execute(ctx: Context): any {
    return Util.resolveValue(v=>this.callLeft(ctx, v), this.left.execute(ctx));
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

