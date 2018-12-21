import JelObject from '../JelObject';
import SerializablePrimitive from '../SerializablePrimitive';


export default class ReferenceHelper extends JelObject implements SerializablePrimitive {
	constructor(public distinctName: string) {
		super();
	}
		
	serializeToString(pretty: boolean, indent: number, spaces: string) : string | undefined {
		return '@'+this.distinctName;
	}
}


