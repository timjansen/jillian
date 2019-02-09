import JelObject from '../JelObject';
import NativeJelObject from './NativeJelObject';
import Class from './Class';
import SerializablePrimitive from '../SerializablePrimitive';
import BaseTypeRegistry from '../BaseTypeRegistry';


export default class ReferenceHelper extends NativeJelObject implements SerializablePrimitive {
  static clazz: Class|undefined;

	constructor(public distinctName: string) {
		super('ReferenceHelper');
	}
		
  get clazz(): Class {
    return ReferenceHelper.clazz!;
  }  
  
	serializeToString(pretty: boolean, indent: number, spaces: string) : string | undefined {
		return '@'+this.distinctName;
	}
}

const p: any = ReferenceHelper.prototype;
p.distinctName_jel_property = true;

BaseTypeRegistry.register('ReferenceHelper', ReferenceHelper);

