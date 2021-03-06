import JelNode from './JelNode';
import Context from '../Context';
import JelObject from '../JelObject';
import SourcePosition from '../SourcePosition';
import Util from '../../util/Util';
import TryElement from './TryElement';
import ScriptException from '../ScriptException';


/**
 * Defines a try statement.
 * 
 * Examples:
 *   try a = anyValue() 
 *   when number: a+1
 *   when string: a+" "
 *   catch MyException: 0
 *   else a
 */
export default class Try extends JelNode {
  exceptionElements: TryElement[];
  returnElements: TryElement[];

  constructor(position: SourcePosition, public varName: string|undefined, public expression: JelNode, public elements: TryElement[]) {
    super(position, [expression].concat(elements.map(e=>e.expression!), elements.map(e=>e.condition).filter(e=>!!e) as JelNode[]));
    this.exceptionElements = elements.filter(e=>e.exceptionHandler);
    this.returnElements = elements.filter(e=>!e.exceptionHandler);
  }
  
  private checkElements(ctx: Context, elements: TryElement[], value: JelObject|null, startAt: number): JelObject|null|undefined|Promise<JelObject|null|undefined> {
    for (let i = startAt; i < elements.length; i++) {
      const r = elements[i].execute(ctx, value);
      if (r instanceof Promise) {
        return r.then(r=>r == undefined ? this.checkElements(ctx, elements, value, i+1) : r);
      }
      else if (r !== undefined)
        return r;
    }
    return undefined;
  }

  private dispatch(ctx: Context, value: JelObject|null, isException = false): JelObject|null|Promise<JelObject|null> {
    let clauseCtx;
    if (this.varName) {
      clauseCtx = new Context(ctx);
      clauseCtx.set(this.varName, value);
      clauseCtx.freeze(!isException && this.expression.isStatic(ctx));
    }
    else
      clauseCtx = ctx;
    
    return Util.resolveValue(this.checkElements(clauseCtx, isException ? this.exceptionElements : this.returnElements, value, 0), r=>r === undefined ? (isException ? undefined : value) : r);
  }

  private dispatchException(ctx: Context, exception: ScriptException): JelObject|null|Promise<JelObject|null> {
    if (exception instanceof ScriptException) {
      const r = this.dispatch(ctx, exception.exception, true);
      if (r !== undefined)
        return r;
    }
    throw exception;
  }

  // override
  executeImpl(ctx: Context): JelObject|null|Promise<JelObject|null> {
    try {
      const value = this.expression.execute(ctx);
      if (value instanceof Promise)
        return value.then(v=>this.dispatch(ctx, v), e=>this.dispatchException(ctx, e));
      else
        return this.dispatch(ctx, value);
    }
    catch (e) {
      return this.dispatchException(ctx, e);
    }
  }
  
  isStatic(ctx: Context): boolean {
    return false;
  }

  flushCache(): void {
  }
  
  // override
  equals(other?: JelNode): boolean {
    return (other instanceof Try) &&
      this.varName == other.varName &&
			this.expression.equals(other.expression) && 
      this.elements.length == other.elements.length && 
      !this.elements.find((l, i)=>!l.equals(other.elements[i]));
  }
  
	toString(): string {
    const clauses = this.elements.map(e=>e.toString()).join('\n');
    if (this.varName)
      return `try ${this.varName}=${this.expression.toString()}\n${clauses}`;		
    else
		  return `try ${this.expression.toString()}\n${clauses}`;		
	}
}

