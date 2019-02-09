import SerializablePrimitive from './SerializablePrimitive';
import JelNode from './expressionNodes/JelNode';
import TypedParameterValue from './TypedParameterValue';
import JelObject from './JelObject';
import Context from './Context';
import Serializer from './Serializer';
import LambdaCallable from './LambdaCallable';
import TypeChecker from './types/TypeChecker';
import Util from '../util/Util';
import NativeJelObject from './types/NativeJelObject';
import Class from './types/Class';
import BaseTypeRegistry from './BaseTypeRegistry';

/**
 * A kind of lightweight callable that supports only executing and serialization.
 */
export default class LambdaExecutable extends NativeJelObject implements SerializablePrimitive {
  static clazz: Class|undefined;

  constructor(public expression: JelNode) {
		super('LambdaExecutable');
  }
  
  get clazz(): Class {
    return LambdaExecutable.clazz!
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
  
  static create_jel_mapping = true;
  static create(ctx: Context, ...args: any[]): LambdaExecutable|Promise<LambdaExecutable> {
    return new LambdaExecutable(TypeChecker.instance(LambdaCallable, args[0], 'func').expression);
  }
}

const p: any = LambdaExecutable.prototype;
p.execute_jel_mapping = true;


BaseTypeRegistry.register('LambdaExecutable', LambdaExecutable);
