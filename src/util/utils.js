'use strict';


class Utils {
	static promisefy(p) {
		if (p instanceof Promise)
			return p;
		else
			return {then: f=>f(p)};
	}
	
}
