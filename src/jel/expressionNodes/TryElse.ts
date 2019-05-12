import JelNode from './JelNode';
import CachableJelNode from './CachableJelNode';
import Assignment from './Assignment';
import Context from '../Context';
import JelObject from '../JelObject';
import SourcePosition from '../SourcePosition';
import BaseconditionRegistry from '../BaseTypeRegistry';
import Util from '../../util/Util';
import TryElement from './TryElement';
import BaseTypeRegistry from '../BaseTypeRegistry';


/**
 * Defines the 'else' in an Try clause
 * 
 * Examples:
 *   try a = anyValue() 
 *   if isOdd(a): a+1
 *   else a*8
 */
export default class TryElse extends TryElement {

  constructor() {
    super(undefined, false);
  }
  
  // override
  execute(ctx:Context, value: JelObject|null): JelObject|null|Promise<JelObject|null|undefined>|undefined {
    return this.expression!.execute(ctx);
  }
  
  
  // override
  equals(other?: TryElement): boolean {
		return (other instanceof TryElse) &&
    this.expression!.equals(other.expression);
	}
  
	toString(): string {
		return `else ${this.expression!.toString()}`;
	}
}

