import JelNode from './JelNode';
import Context from '../Context';
import BaseTypeRegistry from '../BaseTypeRegistry';
import JelObject from '../JelObject';


/**
 * Represents a literal, atomic value (JelBoolean, number, string, null).
 *
 * Examples:
 *   null
 *   true
 *   false
 *   1
 *   -1
 *   2.54
 *	 10.43e-23
 *   "foo"
 *	 'bar'
 *	 "it said \"boo\""
 *	 'it said "boo"'
 *	 "Here are some indented lines:\n\tLine1\n\tLine2\n"
 */
export default class Literal extends JelNode {
	public value: any;
	constructor(value: any) {
    super();
		if (value === true || value === false)
			this.value = BaseTypeRegistry.get('Boolean').valueOf(value);
		else if (value == null)
			this.value = null;
		else if (typeof value == 'number')
			this.value = BaseTypeRegistry.get('Float').valueOf(value);
		else if (typeof value == 'string')
			this.value = BaseTypeRegistry.get('String').valueOf(value);
		else
			throw new Error('Unsupported literal type: '+value);
  }

  // override
  execute(ctx: Context): JelObject|null {
    return this.value;
  }
  
  isStatic(): boolean {
    return true;
  }
  
    
  flushCache(): void {
  }

  
  // override
  equals(other?: JelNode): boolean {
		return other instanceof Literal &&
      this.value == other.value;
	}
  
	toString(): string {
		if (this.value == null)
			return 'null';
		else 
			return this.value.toString();
	}  
	
  getSerializationProperties(): any[] {
    return [this.value];
  }
}



