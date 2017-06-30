'use strict';

const JelType = require('./type.js');

class LazyRef extends JelType {
	// returns either value or Promise
	get(ctx) {
		throw new Error('LazyRef.get needs to be overridden');
	}
}

module.exports = LazyRef;
