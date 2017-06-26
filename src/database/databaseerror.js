'use strict';

const ChainableError = require('../util/chainableerror.js');

class DatabaseError extends ChainableError {

	constructor(cause, msg) {
		super(cause, msg);
		Error.captureStackTrace(this, DatabaseError);
		this.redoStack();
	}

	rethrow(cause, msg) {
		if (cause instanceof DatabaseError)
			throw cause;
		throw new DatabaseError(cause, msg);
	}
}

module.exports = DatabaseError;