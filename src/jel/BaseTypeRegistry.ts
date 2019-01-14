import Util from '../util/Util';

// A collection of basic types, like JelString and Float. 
// This is mainly used to avoid circular dependencies that Typescript can not resolve.
export default class BaseTypeRegistry {
	private static reg: any =  {};
	
	static register(name: string, ctor: any): void {
		BaseTypeRegistry.reg[name] = ctor;
	}
	
	static get(name: string): any {
		const o = BaseTypeRegistry.reg[name];
		if (!o)
			throw new Error(`Type ${name} not registered yet.`);
		return o;
	}
	
	static mapNativeTypes(v0: any): any {
    return Util.resolveValue(v0, (v: any)=>{
      if (v == null)
        return null;

      const tv = typeof v;
      if (tv == 'object')
        return v;
      if (typeof v == 'number')
        return BaseTypeRegistry.get('Float').valueOf(v);
      if (typeof v == 'string')
        return BaseTypeRegistry.get('String').valueOf(v);
      if (typeof v == 'boolean')
        return BaseTypeRegistry.get('Boolean').valueOf(v);

      throw new Error('Function returned unsupported type: '+v.toString());
    });
	}
}

