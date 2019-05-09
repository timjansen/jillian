import JelNode from './JelNode';
import CachableJelNode from './CachableJelNode';
import Assignment from './Assignment';
import Context from '../Context';
import JelObject from '../JelObject';
import SourcePosition from '../SourcePosition';
import BaseTypeRegistry from '../BaseTypeRegistry';
import Util from '../../util/Util';


/**
 * Base class for clauses in try.
 */
export default abstract class TryElement {
	protected typeHelper: any;	

  constructor(public expression: JelNode, public exceptionHandler: boolean) {
    this.typeHelper = BaseTypeRegistry.get('TypeHelper');
  }

  // Executes clause for given value. Returns result, or undefined if condition failed.
  abstract execute(ctx:Context, value: JelObject|null): JelObject|null|Promise<JelObject|null|undefined>|undefined;
  
  
  abstract equals(other?: TryElement): boolean;
  
	abstract toString(): string;
}

