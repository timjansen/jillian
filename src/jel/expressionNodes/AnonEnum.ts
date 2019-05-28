import JelNode from './JelNode';
import CachableJelNode from './CachableJelNode';
import Assignment from './Assignment';
import Context from '../Context';
import JelObject from '../JelObject';
import {IDbRef, IDbSession} from '../IDatabase';
import Util from '../../util/Util';
import SourcePosition from '../SourcePosition';
import BaseTypeRegistry from '../BaseTypeRegistry';


/**
 * An anonymous enum value. This is a shortcut for typed enums. 
 * 
 * Examples:
 *   #RAW
 *	 #PAST
 */
export default class AnonEnum extends CachableJelNode {
  enumValue: any;
  constructor(position: SourcePosition, public name: string) {
    super(position);
  }
  
  // override
  executeUncached(ctx: Context): JelObject|null|Promise<JelObject|null> {
    if (!this.enumValue)
      this.enumValue = BaseTypeRegistry.get('EnumValue').valueOf(this.name, BaseTypeRegistry.get('Enum').anonymous);
    return this.enumValue;
  }
  
  isStaticUncached(ctx: Context): boolean {
    return false;
  }
  
  flushCache(): void {
    super.flushCache();
  }
  
  // overrride
  equals(other?: JelNode): boolean {
		return other instanceof AnonEnum &&
      this.name == other.name;
	}
  
	toString(): string {
		return `#${this.name}`;	
	}

}

