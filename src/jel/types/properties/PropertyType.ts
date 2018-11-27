import JelObject from '../../JelObject';
import Context from '../../Context';
import JelBoolean from '../JelBoolean';

/**
 * Abstract prototype to define the type of a property.
 */
export default abstract class PropertyType extends JelObject {
  
  constructor() {
    super();
  }
  
  checkProperty_jel_mapping: Object;
  abstract checkProperty(ctx: Context, value: JelObject|null): boolean;

}

PropertyType.prototype.checkProperty_jel_mapping = ['value'];


