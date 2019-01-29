import BaseTypeRegistry from './BaseTypeRegistry';
import JelObject from './JelObject';
import Context from './Context';
import Serializer from './Serializer';
import FunctionCallable from './FunctionCallable';
import IClass from './IClass';
import SerializablePrimitive from './SerializablePrimitive';


/**
 * Represents a natively implemented type as JelObject.
 */
export default class NativeClass extends JelObject implements IClass, SerializablePrimitive {
  methods = new Map<string, FunctionCallable>();
  name: string;
  iClass: boolean = true;
  
	constructor(public ctor: any) {
		super('NativeClass');
    this.name = ctor.jelName || ctor.name;
    
    for (let prop in ctor) 
      if (/^\w+_jel_mapping$/.test(prop)) {
        const name = prop.replace(/_jel_mapping$/, '');
        if (typeof ctor[name] != 'function')
          throw new Error(`No matching function ${name} for mapping ${prop} in ${ctor.name}`);
        this.methods.set(name, new FunctionCallable(ctor[name], ctor[prop], undefined, name));
      }
	}
	
	/**
	 * Returns the value of the member, or undefined if there is no member of this name in the object.
	 */ 
	member_jel_mapping: Object;
	member(ctx: Context, name: string, parameters?: Map<string, JelObject|null>): JelObject|null|undefined {
    const m = this.methods.get(name);
    if (m)
      return m;
    
		if (this.ctor.JEL_PROPERTIES && (name in this.ctor.JEL_PROPERTIES))
			return BaseTypeRegistry.mapNativeTypes((this.ctor as any)[name]);
		return undefined;
	}
	
 	serializeToString(pretty: boolean, indent: number, spaces: string, serializer: (object: any, pretty: boolean, indent: number, spaces: string)=>string): string | undefined {
    return this.name;
  }

  
	toString(): string {
		return `NativeClass ${this.name} for ${this.ctor.name}`;
	}

}

