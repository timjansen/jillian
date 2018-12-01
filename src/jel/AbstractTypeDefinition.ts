import BaseTypeRegistry from './BaseTypeRegistry';
import JelObject from './JelObject';
import Context from './Context';
import Serializer from './Serializer';
import FunctionCallable from './FunctionCallable';


/**
 * This is the base class for all objects that can be accessed by JEL. It implements operators and other functions required in JEL.
 */
export default abstract class AbstractTypeDefinition extends JelObject {
  methods = new Map<string, FunctionCallable>();
  typeName: string;
  
	constructor(public ctor: any) {
		super('NativeType');
    
    this.typeName = ctor.name;
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
    
		if (name in this.ctor.JEL_PROPERTIES)
			return BaseTypeRegistry.mapNativeTypes((this.ctor as any)[name]);
		return undefined;
	}
	
	toString(): string {
		return `NativeTypeDefinition for ${this.ctor.name}`;
	}

}

