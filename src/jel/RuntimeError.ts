import ChainableError from '../util/ChainableError';
import SourcePosition from './SourcePosition';

export default class RuntimeError extends ChainableError {
  public readonly callstack: string[] = [];
  
	constructor(public position: SourcePosition, public desc: string = "no error defined", cause?: Error) {
		super(cause, `${desc} --> ${position.src}:${position.line}:${position.column}`);
		(Error as any).captureStackTrace(this, RuntimeError);
		this.redoStack();
	}

	toString(): string {
  	return this.cause ? this.msg + '\n\n' + this.cause.toString() : this.msg || '(never happens)'; 
	}
	
}

