import Util from '../util/Util';
import Serializable from './Serializable';
import SerializablePrimitive from './SerializablePrimitive';

/**
 * Serializes an object tree of serializable nodes into a JSON-like, JEL-readable string representation. Primitives (number, string, boolean, array)
 * are seriallized like JSON. Objects use JEL constructor logic.
 *
 * Example: Range(max=Length(value=2, unit='m'), min=(value=5, unit='m'))
 *
 * To make an object serializable, you need to implement a method getSerializationProperties() which must return its properties.
 */
const SPACES = '                                                           ';
function spaces(i: number) {
	return SPACES.substr(0, i*2);
}

export default class Serializer {
	static serialize(obj: any, pretty = false, indent = 0): string {
		if (obj == null)
			return "null";

		const type = typeof obj;
		if (type == 'object') {
			if ('serializeToString' in obj) {
				const s = (obj as SerializablePrimitive).serializeToString(pretty, indent, SPACES, Serializer.serialize);
				if (s != null)
					return s;
			}
			
			if ('getSerializationProperties' in obj) {
				const props = (obj as Serializable).getSerializationProperties();
				let r = (obj.jelTypeName || obj.constructor.name) + '(';
				if (Array.isArray(props)) {
					for (let i = 0; i < props.length; i++) {
						if (i > 0)
							r += pretty ? ', ' : ',';
						r += Serializer.serialize(props[i], pretty, indent+2);
					}
					return r + ')';
				}
				else {
					const names: string[] = [];
					for (let name in props)
						names.push(name);
					names.sort();
					let c = 0;
					names.forEach((name) => {
						const value = props[name];
						if (value != null) {
							if (c > 0)
								r += ',';
							if (pretty)
								r += '\n' + spaces(indent+1)
							r += name + '=' + Serializer.serialize(value, pretty, indent+2);
							c++;
						}
					});
					if (pretty)
						return r + '\n' + spaces(indent) + ')';
					else
						return r + ')';
				}
			}
			else if (typeof obj.length == 'number') 
				return Serializer.serializeArray(obj, pretty, indent);
			else
				return `"unserializable object. type=${obj?obj.constructor.name:'?'}"`;
		}
		else if (type == 'string' || type == 'number' || type == 'boolean')
			return JSON.stringify(obj);
		return obj.toString();
	}

	static serializeArray(obj: any, pretty = false, indent = 0): string {
			let r = '[';
			for (let i = 0; i < obj.length-1; i++)
				r += Serializer.serialize(obj[i], pretty, indent) + (pretty ? ', ' : ',');
			if (obj.length)
				r += Serializer.serialize(obj[obj.length-1], pretty, indent);
			return r + ']';
	}
}

