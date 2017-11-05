import Dictionary from './types/Dictionary';
import List from './types/List';
import Pattern from './types/Pattern';
import DbEntry from '../database/DbEntry';
import DbRef from '../database/DbRef';
import Util from '../util/Util';
import Serializable from './Serializable';

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
		return Serializer.serializeInternal(obj, pretty, indent, true);
	}

	private static serializeInternal(obj: any, pretty = false, indent = 0, primary = false): string {
		if (obj == null)
			return "null";

		const type = typeof obj;
		if (type == 'object') {
			if (obj instanceof Dictionary) {
				if (!obj.size)
					return "{}";
				let r = '{';
				let i = 0;
				const last = obj.elements.size-1;
				obj.elements.forEach((value, key) => {
					if (pretty)
						r += '\n'+spaces(2);
					if (typeof key == 'string' && /^[a-zA-Z_]\w*$/.test(key))
						r += key;
					else 
						r += Serializer.serializeInternal(key, pretty, indent);
					r += (pretty ? ': ' : ':') + Serializer.serializeInternal(value, pretty, indent)
					if (i++ < last)
						r += pretty ? ', ' : ',';
				});
				if (pretty)
					r += '\n';
				return r + '}';
			}
			else if (obj instanceof List) 
				return Serializer.serializeArray(obj.elements, pretty, indent);
			else if (obj instanceof Pattern) 
				return '`' + obj.patternText.replace(/`/g, '\\`') + '`';
			else if ((obj instanceof DbRef) || ((obj instanceof DbEntry) && !primary))
				return '@'+obj.distinctName;
			else if ('getSerializationProperties' in obj) {
				const props = (obj as Serializable).getSerializationProperties();
				let r = obj.constructor.name + '(';
				if (Array.isArray(props)) {
					for (let i = 0; i < props.length; i++) {
						if (i > 0)
							r += pretty ? ', ' : ',';
						r += Serializer.serializeInternal(props[i], pretty, indent+2);
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
							r += name + '=' + Serializer.serializeInternal(value, pretty, indent+2);
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
				return '"unsupported object"';
		}
		else if (type == 'string' || type == 'number' || type == 'boolean')
			return JSON.stringify(obj);
		return obj.toString();
	}

	static serializeArray(obj: any, pretty = false, indent = 0): string {
			let r = '[';
			for (let i = 0; i < obj.length-1; i++)
				r += Serializer.serializeInternal(obj[i], pretty, indent) + (pretty ? ', ' : ',');
			if (obj.length)
				r += Serializer.serializeInternal(obj[obj.length-1], pretty, indent);
			return r + ']';
	}
}

