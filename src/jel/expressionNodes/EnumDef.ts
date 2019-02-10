import JelNode from './JelNode';
import JelObject from '../JelObject';
import Context from '../Context';
import Util from '../../util/Util';
import BaseTypeRegistry from '../BaseTypeRegistry';
import SourcePosition from '../SourcePosition';


/**
 * Represents a enum definition. 
 *
 * Examples:
 * enum FactType
 *   Sample, Definition, Estimate
 */ 
export default class EnumDef extends JelNode {
  value: JelObject|undefined;
  
  constructor(position: SourcePosition, public name: string, public values: string[]) {
		super(position);
  }
  
	// override
  executeImpl(ctx: Context): JelObject|null|Promise<JelObject|null> {
    if (this.value)
      return this.value;
    const str = BaseTypeRegistry.get('String');
    this.value = BaseTypeRegistry.get('Enum').create(ctx, this.name, BaseTypeRegistry.get('List').valueOf(this.values.map((v:any)=>str.valueOf(v))));
    return this.value!;
	}
  
  isStatic(): boolean {
    return true;
  }

  flushCache(): void {
    this.value = undefined;
  }

  
	// override
  equals(other?: JelNode): boolean {
		return other instanceof EnumDef &&
      this.name == other.name &&
      this.values.length == other.values.length && 
      !this.values.find((l, i)=>l != other.values[i]);
	}

	toString(): string {
    return `(enum ${this.name}: ${this.values.join(', ')})`;
	}
	
}

