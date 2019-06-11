import JelNode from './JelNode';
import CachableJelNode from './CachableJelNode';
import JelObject from '../JelObject';
import Callable from '../Callable';
import Context from '../Context';
import SourcePosition from '../SourcePosition';
import DeclaringStatement from './DeclaringStatement';
import Import from './Import';
import Util from '../../util/Util';
import ClassDef from './ClassDef';
import BaseTypeRegistry from '../BaseTypeRegistry';
import Assignment from './Assignment';
import { EIDRM } from 'constants';


/**
 * Represents a program, a series of declarations followed by an optional expression. Returns the value of the last expression.
 */
export default class Program extends CachableJelNode {
  
  constructor(position: SourcePosition, public expressions: JelNode[]) {
    super(position, expressions);
  }

  // optimized path for imports
  executeMultiImports(ctx: Context, pos: number = 0): JelObject|null|Promise<JelObject|null> {
    let p = pos;
    while (this.expressions[p] instanceof Import)
      p++;
    const imports: Import[] = this.expressions.slice(pos, p) as any;
    return Util.resolveArray(imports.map(e=>e.execute(ctx)), values=>{
        values.forEach((v,i)=>{
          if (imports[i].name)
            ctx.set(imports[i].name!, v);
          else
            v.eachJs((name: string, val: JelObject|null)=>ctx.set(name, val));
        });
        return this.executeOne(ctx, null, p);
    });
  }

  // recursive impl
  executeOne(ctx: Context, lastValue: JelObject|null|Promise<JelObject|null> = null, pos: number = 0): JelObject|null|Promise<JelObject|null> {
    const expr = this.expressions[pos];
    if (!expr)
      return lastValue;
    if (!((expr as any).isDeclaringStatement))
      return expr.execute(ctx);
    if (expr instanceof Import)
      return this.executeMultiImports(ctx, pos);
    
    const value = expr.execute(ctx);
    if (value instanceof Promise) 
      return value.then(val=>{
        ctx.set((expr as any).name, val);
        return this.executeOne(ctx, val, pos+1);
      });
    ctx.set((expr as any).name, value);
    return this.executeOne(ctx, value, pos+1);
  }

  // override
  executeUncached(ctx: Context): JelObject|null|Promise<JelObject|null> {
    const newCtx = new Context(ctx);

    // create types for all classes, to allow circ deps within a program
    const simpleType = BaseTypeRegistry.get('SimpleType');
    const classes: ClassDef[] = this.expressions.filter(e=>e instanceof ClassDef) as any;
    classes.forEach(c=>newCtx.set(c.name, simpleType.valueOf(c.name)));

    return this.executeOne(newCtx);
  }
  
  isStaticUncached(ctx: Context): boolean {
    return !this.expressions.find(a=>!a.isStatic(ctx));
  }
  
  flushCache(): void {
    super.flushCache();
    this.expressions.forEach(a=>a.flushCache());
  }
 
  // override
  equals(other?: JelNode): boolean {
		if (!(other instanceof Program))
			return false;
		return this.expressions.length == other.expressions.length && 
      !this.expressions.find((l, i)=>!l.equals(other.expressions[i]));
	}
  
  getSerializationProperties(): Object {
    return [this.expressions];
  }
	
	toString(separator='\n'): string {
    return this.expressions.map(e=>{
      if (e instanceof Assignment)
        return `let ${e.toString()}`;
      else if (!(e as any).isDeclaringStatement)
        return `do ${e.toString()}`;
      return e.toString();
    }).join(separator);
	}
}

