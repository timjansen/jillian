import JelNode from './JelNode';
import CachableJelNode from './CachableJelNode';
import Context from '../Context';
import BaseTypeRegistry from '../BaseTypeRegistry';
import JelObject from '../JelObject';
import SourcePosition from '../SourcePosition';

/**
 * Represents a Unit Value
 *
 * Examples:
 *   3 @Meter
 *   3/4 @Inch
 */
export default class UnitValue extends CachableJelNode {
	constructor(position: SourcePosition, public value: JelNode, public unit: string) {
    super(position, [value]);
  }

  // override
  executeUncached(ctx: Context): JelObject | Promise<JelObject> {
			const left: any = this.value.execute(ctx);
			if (left instanceof Promise)
				return left.then((l: any)=>BaseTypeRegistry.get('UnitValue').valueOf(l, this.unit));
			return BaseTypeRegistry.get('UnitValue').valueOf(left, this.unit);
  }
  
  isStaticUncached(ctx: Context): boolean {
    return true;
  }
  
  flushCache(): void {
    super.flushCache();
    this.value.flushCache();
  }
  
  // override
  equals(other?: JelNode): boolean {
		return other instanceof BaseTypeRegistry.get('UnitValue') && (this.value as any).equals((other as any).value) && this.unit == (other as any).unit;
	}
  
	toString(): string {
		return `(${this.value.toString()} @${this.unit})`;
	}  
}



