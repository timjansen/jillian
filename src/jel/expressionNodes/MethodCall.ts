import JelNode from './JelNode';
import CachableJelNode from './CachableJelNode';
import Assignment from './Assignment';
import JelObject from '../JelObject';
import Runtime from '../Runtime';
import Context from '../Context';
import Util from '../../util/Util';
import SourcePosition from '../SourcePosition';

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
 * Represents a method call. 
 *
 * Examples: 
 *     a.myMethod()
 *     a.add(1, 2)
 *     list.sort(key = a=>a.name)
 */
export default class MethodCall extends CachableJelNode {
  constructor(position: SourcePosition, public left: JelNode, public name: string, public argList: JelNode[]  = [], public namedArgs: Assignment[] = [], public forgiving = false) {
    super(position);
  }
  
  
  private callLeft(ctx: Context, left: JelObject|null): JelObject|null|Promise<JelObject|null> {
    const args = this.argList.map(a=>a.execute(ctx));
    
    if (this.namedArgs.length) {
      const argObjValues = this.namedArgs.map(a=>a.execute(ctx));
      return resolveValueObj(objArgs=>Util.resolveArray(args, (listArgs: (JelObject|null)[])=>Runtime.callMethod(ctx, left, this.name, listArgs, objArgs, this.forgiving)), this.namedArgs, argObjValues);
    }
    else
      return Util.resolveArray(args, (listArgs: (JelObject|null)[])=>Runtime.callMethod(ctx, left, this.name, listArgs, undefined, this.forgiving));
  }
  
  // override
  executeUncached(ctx: Context): JelObject|null|Promise<JelObject|null> {
    return Util.resolveValue(this.left.execute(ctx), v=>this.callLeft(ctx, v));
  }
  
  isStaticUncached(ctx: Context): boolean {
    return this.left.isStatic(ctx) && !this.argList.find(a=>!a.isStatic(ctx)) && !this.namedArgs.find(a=>!a.isStatic(ctx));
  }
  
  flushCache(): void {
    this.left.flushCache();
    this.argList.forEach(a=>a.flushCache());
    this.namedArgs.forEach(a=>a.flushCache());
  }

  
  // overrride
  equals(other?: JelNode): boolean {
		return other instanceof MethodCall &&
      this.left.equals(other.left) &&
      this.name == other.name &&
      this.forgiving == other.forgiving &&
      this.argList.length == other.argList.length &&
      this.namedArgs.length == other.namedArgs.length && 
      !this.argList.find((l, i)=>!l.equals(other.argList[i])) &&
      !this.namedArgs.find((l, i)=>!l.equals(other.namedArgs[i]));
	}

	toString(): string {
    const op = this.forgiving ? '.?' : '.';
		if (!this.namedArgs.length)
			return `${this.left}${op}${this.name}(${this.argList.map(s=>s.toString()).join(', ')})`;
		if (!this.argList.length)
			return `${this.left}${op}${this.name}(${this.namedArgs.map(s=>s.toString()).join(', ')})`;

		return `${this.left}${op}${this.name}(${this.argList.map(s=>s.toString()).join(', ')}, ${this.namedArgs.map(s=>s.toString()).join(', ')})`;
	}
}

