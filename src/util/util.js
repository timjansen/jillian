'use strict';


class Util {
	
	static collect(list, f) {
		const r = [];
		for (const l of list) {
			const fr = f(l);
			if (fr && fr.length && typeof fr == 'object')
				r.push.apply(r, fr);
			else if (fr != null)
				r.push(fr);
		}
		return r;		
	}

	// adds the array src, if set, to the array dest. src and dest can be null which represents an empty list.
	static addToArray(dest, src) {
		if (!src)
			return dest;
		if (!dest)
			return Array.from(src);
		dest.push.apply(dest, src);
		return dest;
	}
	
	static propertyNames(obj) {
		const r = [];
		for (const name in obj)
			if (obj.hasOwnProperty(name))
				r.push(name);
		return r;
	}
}

module.exports = Util;
