import JelObject from '../../jel/JelObject';
import Context from '../../jel/Context';
import JelBoolean from '../../jel/types/JelBoolean';

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

PropertyType.prototype.checkProperty_jel_mapping = {value: 1};


