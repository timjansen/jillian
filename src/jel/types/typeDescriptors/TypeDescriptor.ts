import JelObject from '../../JelObject';
import Context from '../../Context';
import JelBoolean from '../JelBoolean';
import Util from '../../../util/Util';

/**
 * Abstract prototype to define the type of a value.
 */
export default abstract class TypeDescriptor extends JelObject {
  
  constructor() {
    super();
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
    return Util.resolveValue(this.checkType(ctx, value), (b: JelBoolean)=>b.toRealBoolean() ? value : Promise.reject(new Error(`Failed to convert${fieldName?' '+fieldName:''} to ${this.serializeType()}. Value ${value&&value.toString()} is not compatible.`)));
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

}

TypeDescriptor.prototype.checkType_jel_mapping = ['value'];
TypeDescriptor.prototype.convert_jel_mapping = ['value', 'fieldMapping'];
TypeDescriptor.prototype.isNullable_jel_mapping = [];

