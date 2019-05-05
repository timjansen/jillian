import JelObject from '../../JelObject';
import NativeJelObject from '../NativeJelObject';
import Context from '../../Context';
import JelBoolean from '../JelBoolean';
import Util from '../../../util/Util';

/**
 * Abstract prototype to define the type of a value.
 */
export default abstract class TypeDescriptor extends NativeJelObject {

  constructor(className: string) {
    super(className);
  }
  
  /**
   * Checks whether the type of the given value is compatible with the descriptor.
   * @return true if the type matches
   */
  checkType_jel_mapping: Object;
  abstract checkType(ctx: Context, value: JelObject|null): JelBoolean|Promise<JelBoolean>;
 
   
  /**
   * Checks whether the type of the given value is compatible with the descriptor, possibly converting it. Returns a rejected promise if not compatible.
   * The default implementation just returns the value without conversion.
   * @return the converted type.
   */
  convert_jel_mapping: Object;
  convert(ctx: Context, value: JelObject|null, fieldName=''): JelObject|null|Promise<JelObject|null> {
    return Util.resolveValue(this.checkType(ctx, value), (b: JelBoolean)=>b.toRealBoolean() ? value : Promise.reject(new Error(`Failed to convert${fieldName?" value for '"+fieldName+"'":''} to ${this.serializeType()}. Value ${value&&value.toString()} with type ${value&&value.className} is not compatible.`)));
  }

  /**
   * Checks whether this argument can be null. This is important because if not, a value must provided.
   */
  isNullable_jel_mapping: Object;
  isNullable(ctx: Context): boolean {
    return false;
  }
  
  /**
   * Returns true if this TypeDescriptor is identical with the given one.
   */
  equals_jel_mapping: Object;
  abstract equals(ctx: Context, other: TypeDescriptor|null): JelBoolean|Promise<JelBoolean>;

  /**
   * Compares two (nullable) TypeDescriptors.
   */
  static equals(ctx: Context, a: TypeDescriptor|null|undefined, b: TypeDescriptor|null|undefined): JelBoolean|Promise<JelBoolean> {
    return a == null ? JelBoolean.valueOf(b == null) : a.equals(ctx, b||null);
  }
  
  
  
  /**
   * A simplified serialization for places that use TypeHelper.convert..().
   */
  abstract serializeType(): string;

  /**
   * Serialize to string.
   */
  serializeToString_jel_mapping: Object;
  serializeToString() : string {
		return this.serializeType();
	}
  
}

TypeDescriptor.prototype.checkType_jel_mapping = true;
TypeDescriptor.prototype.convert_jel_mapping = true;
TypeDescriptor.prototype.equals_jel_mapping = true;
TypeDescriptor.prototype.serializeToString_jel_mapping = true;
TypeDescriptor.prototype.isNullable_jel_mapping = true;

