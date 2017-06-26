'use strict';


class ChainableError extends Error {

	constructor(cause, msg) {
		if (!cause || (typeof cause == 'string')) {
			super(cause);
			Error.captureStackTrace(this, ChainableError);
		}
		else {
			super(msg);
			Error.captureStackTrace(this, ChainableError);
			this.cause = cause;
			this.redoStack();
		}
	}
	
	redoStack() {
		if (this.cause)
			this.stack = `${this.stack} \n\ncaused by ${this.cause.stack}`;
	}
	
}

module.exports = ChainableError;
