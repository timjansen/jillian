import JelNode from './JelNode';
import Assignment from './Assignment';
import JelObject from '../JelObject';
import BaseTypeRegistry from '../BaseTypeRegistry';
import Runtime from '../Runtime';
import Callable from '../Callable';
import Context from '../Context';
import Util from '../../util/Util';

/**
 * Represents an set of type options. Returns a OptionType.
 *
 * Examples: 
 *  Float|String
 *  @Length|@Size|null
 */
export default class Options extends JelNode {
  constructor(public options: JelNode[]) {
    super();
  }
  
  // override
  execute(ctx: Context): JelObject {
    return Util.resolveArray(this.options.map(o=>o.execute(ctx)), v=>BaseTypeRegistry.get('OptionType').valueOf(v));
  }
  
  // overrride
  equals(other?: JelNode): boolean {
		return other instanceof Options && 
      this.options.length == other.options.length && 
      !this.options.find((l, i)=>!l.equals(other.options[i]));
	}
  
	toString(): string {
		return this.options.map(o=>o.toString()).join('|');
	}
  
  getSerializationProperties(): any {
    return [this.options];
  }
}


