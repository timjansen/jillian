'use strict';

/**
 * Serializes an object tree of serializable nodes into a JSON-like, JEL-readable string representation. Primitives (number, string, boolean, array)
 * are seriallized like JSON. Objects use JEL constructor logic.
 *
 * Example: Range(max=Length(value=2, unit='m'), min=(value=5, unit='m'))
 *
 * To make an object serializable, you need to implement a method getSerializationProperties() which must return its properties.
 */
const SPACES = '                                                           ';
function spaces(i) {
	return SPACES.substr(0, i*2);
}

function serialize(obj, pretty, indent = 0) {
	if (obj == null)
		return "null";
	
	const type = typeof obj;
	if (type == 'object') {
		if ('getSerializationProperties' in obj) {
			const props = obj.getSerializationProperties();
			let r = obj.constructor.name + '(';
			const names = [];
			for (let name in props)
				names.push(name);
			names.sort();
			names.forEach((name, c) => {
				if (c > 0)
					r += ',';
				if (pretty)
					r += '\n' + spaces(indent+1)
				r += name + '=' + serialize(props[name], pretty, indent+2);
			});
			if (pretty)
				return r + '\n' + spaces(indent) + ')';
			else
				return r + ')';
		}
		else if (typeof obj.length == 'number') { 
			let r = '[';
			for (let i = 0; i < obj.length-1; i++)
				r += serialize(obj[i], pretty, indent) + (pretty ? ', ' : ',');
			if (obj.length)
				r += serialize(obj[obj.length-1], pretty, indent);
			return r + ']';
		}
	}
	else if (type == 'string' || type == 'number' || type == 'boolean')
		return JSON.stringify(obj);
	return obj.toString();
}

module.exports = {serialize};