import JelObject from '../../JelObject';
import Context from '../../Context';
import JelBoolean from '../JelBoolean';

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
   * A simplified serialization for places that use TypeHelper.convert..().
   */
  abstract serializeType(): string;

}

TypeDescriptor.prototype.checkType_jel_mapping = ['value'];


