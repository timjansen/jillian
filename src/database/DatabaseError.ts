import ChainableError from '../util/ChainableError';

export default class DatabaseError extends ChainableError {

	constructor(msg: string, cause?: Error) {
		super(cause, msg);
		Error.captureStackTrace(this, DatabaseError);
		this.redoStack();
	}

	static rethrow(msg: string, cause: Error): never {
		if (cause instanceof DatabaseError)
			throw cause;
		throw new DatabaseError(msg, cause);
	}
}

