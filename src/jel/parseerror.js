'use strict';

const ChainableError = require('../util/chainableerror.js');

class ParseError extends ChainableError {

	constructor(cause, msg, token) {
		super(cause, msg);
		Error.captureStackTrace(this, ParseError);
		this.redoStack();
		this.token = token;
	}

	toString() {
		const base = this.msg + '\n' + (this.token ? JSON.stringify(this.token) : '(no token for reference)');
		if (this.cause instanceof ParseError)
			return base + '\n\n' + this.cause.toString;
		return base;
	}
	
	static rethrow(cause, msg, token) {
		if (cause instanceof ParseError)
			throw cause;
		throw new ParseError(cause, msg, token);
	}
}

module.exports = ParseError;