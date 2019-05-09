import BaseTypeRegistry from '../BaseTypeRegistry';
import Class from './Class';
import Dictionary from './Dictionary';
import JelString from './JelString';
import JelBoolean from './JelBoolean';
import JelObject from '../JelObject';
import Method from './Method';
import Property from './Property';
import TypedParameterValue from '../TypedParameterValue';
import Serializable from '../Serializable';
import Callable from '../Callable';
import Context from '../Context';
import Util from '../../util/Util';

/**
 * Base class for all native implementations of JEL classes. 
 */ 
export default abstract class NativeJelObject extends JelObject implements Serializable {
  
  constructor(className: string) {
    super(className);
  }
  
  abstract get clazz(): Class;
    
	member(ctx: Context, name: string): JelObject|null|Promise<JelObject|null>|undefined {
    const c = (this.clazz as Class);
    if (c.allProperties.elements.has(name)) {
      const t: any = this;
      if (t[`${name}_jel_property`])
        return BaseTypeRegistry.mapNativeTypes(t[name]);
      else if (t[`${name}_jel_mapping`])
        return BaseTypeRegistry.mapNativeTypes(t[name](ctx));
      else if (name in t)
        throw new Error(`Native property ${name} in ${this.className} does noes have required ${name}_jel_property. Not accessible.`);
    }
   
    const method = c.allMethods.elements.get(name);
    if (method)
      return (method as Method).callable.rebind(this);
    return undefined;    
	}
   
  getSerializationProperties(): any {
    throw new Error(`You need to override getSerializationProperties() in ${this.className}`);
  }
}

BaseTypeRegistry.register('NativeJelObject', NativeJelObject);

