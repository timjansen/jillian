import JelObject from '../../JelObject';
import Context from '../../Context';
import JelBoolean from '../JelBoolean';

/**
 * Abstract prototype to define the type of a property.
 */
export default abstract class TypeDescriptor extends JelObject {
  
  constructor() {
    super();
  }
  
  checkType_jel_mapping: Object;
  abstract checkType(ctx: Context, value: JelObject|null): boolean;

}

TypeDescriptor.prototype.checkType_jel_mapping = ['value'];


