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
 * Represents a method call. 
 *
 * Examples: 
 *     a.myMethod()
 *     a.add(1, 2)
 *     list.sort(key = a=>a.name)
 */
export default class MethodCall extends JelNode {
  constructor(public left: JelNode, public name: string, public argList: JelNode[]  = [], public namedArgs: Assignment[] = []) {
    super();
  }
  
  
  private callLeft(ctx: Context, left: JelObject|null): JelObject|null|Promise<JelObject|null> {
    const args = this.argList.map(a=>a.execute(ctx));
    const argObjValues = this.namedArgs.map(a=>a.execute(ctx));
    
    return resolveValueObj(objArgs=>Util.resolveArray(args, (listArgs: any[])=>Runtime.callMethod(ctx, left, this.name, listArgs, objArgs)), this.namedArgs, argObjValues);
  }
  
  // override
  execute(ctx: Context): JelObject|null|Promise<JelObject|null> {
    return Util.resolveValue(this.left.execute(ctx), v=>this.callLeft(ctx, v));
  }
  
  // overrride
  equals(other?: JelNode): boolean {
		return other instanceof MethodCall &&
      this.left.equals(other.left) &&
      this.name == other.name &&
      this.argList.length == other.argList.length &&
      this.namedArgs.length == other.namedArgs.length && 
      !this.argList.find((l, i)=>!l.equals(other.argList[i])) &&
      !this.namedArgs.find((l, i)=>!l.equals(other.namedArgs[i]));
	}

	toString(): string {
		if (!this.namedArgs.length)
			return `${this.left}.${this.name}(${this.argList.map(s=>s.toString()).join(', ')})`;
		if (!this.argList.length)
			return `${this.left}.${this.name}(${this.namedArgs.map(s=>s.toString()).join(', ')})`;

		return `${this.left}.${this.name}(${this.argList.map(s=>s.toString()).join(', ')}, ${this.namedArgs.map(s=>s.toString()).join(', ')})`;
	}
  
  getSerializationProperties(): Object {
    return {left: this.left, name: this.name, argList: this.argList, namedArgs: this.namedArgs};
  }
}

