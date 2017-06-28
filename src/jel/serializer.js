'use strict';

const Dictionary = require('./dictionary.js');

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
		if (obj instanceof Dictionary) {
			if (!obj.size)
				return "{}";
			let r = '{';
			let i = 0;
			const last = obj.elements.size-1;
			for (let key of obj.elements.keys()) {
				const value = obj.elements.get(key);
				if (pretty)
					r += '\n'+spaces(2);
				if (typeof key == 'string' && /^[a-zA-Z_]\w*$/.test(key))
					r += key;
				else 
					r += serialize(key, pretty, indent);
				r += (pretty ? ': ' : ':') + serialize(value, pretty, indent)
				if (i++ < last)
					r += pretty ? ', ' : ',';
			}
			if (pretty)
				r += '\n';
			return r + '}';
		}
		else if ('getSerializationProperties' in obj) {
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
		else
			return '"unsupported object"';
	}
	else if (type == 'string' || type == 'number' || type == 'boolean')
		return JSON.stringify(obj);
	return obj.toString();
}

module.exports = {serialize};