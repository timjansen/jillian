import SerializablePrimitive from './SerializablePrimitive';
import JelNode from './expressionNodes/JelNode';
import TypedParameterValue from './TypedParameterValue';
import JelObject from './JelObject';
import NamedObject from './NamedObject';
import Context from './Context';
import Serializer from './Serializer';
import LambdaCallable from './LambdaCallable';
import TypeChecker from './types/TypeChecker';
import Util from '../util/Util';


/**
 * A kind of lightweight callable that supports only executing and serialization.
 */
export default class LambdaExecutable extends JelObject implements SerializablePrimitive {
  
  constructor(public expression: JelNode) {
		super();
  }

  execute(ctx: Context): JelObject|null|Promise<JelObject|null> {
    return this.expression.execute(ctx);
  }

  isStatic(ctx: Context): boolean {
    return this.expression.isStatic(ctx);
  }

  flushCache(): void {
    this.expression.flushCache();
  }
  
  equals(other?: LambdaExecutable): boolean {
    if (other instanceof LambdaExecutable)
      return this.expression.equals(other.expression);
    return false;
  }
  
	serializeToString() : string {
		return this.toString();
	}

	toString(): string {
		return `LambdaExecutable(()=>${this.expression.toString()})`;
	}
  
  static create_jel_mapping = ['expression'];
  static create(ctx: Context, ...args: any[]): LambdaExecutable|Promise<LambdaExecutable> {
    return new LambdaExecutable(TypeChecker.instance(LambdaCallable, args[0], 'expression').expression);
  }
}
