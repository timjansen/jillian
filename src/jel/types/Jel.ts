import JelObject from '../JelObject';
import Runtime from '../Runtime';
import Callable from '../Callable';
import Context from '../Context';
import JelString from './JelString';
import List from './List';
import TypeChecker from './TypeChecker';
import NativeJelObject from './NativeJelObject';
import Class from './Class';
import BaseTypeRegistry from '../BaseTypeRegistry';


/**
 * Collection of static helper methods.
 */
export default class Jel extends NativeJelObject {
  static clazz: Class|undefined;
  
  get clazz(): Class {
    return Jel.clazz!
  }
  
  private static toString(s: any): string {
    if (s == null)
      return 'null';
    else
      return s.toString();
  }
  
  private static buildMessage(ctx: Context, args: (JelObject|null)[], len: number): string {
    if (!len)
      return '';
    let s = Jel.toString(args[0]);
    for (let i = 1; i < len; i++) {
      const n = Jel.toString(args[i])
      if (!(s.endsWith(' ') || n.startsWith(' ')))
        s += ' ';
      s += n;
    }
    return s;
  }
  
	static throw_jel_mapping = true;
	static throw(ctx: Context, args: List): Promise<Error> {
		return Promise.reject(new Error(Jel.buildMessage(ctx, args.elements, args.length)));
	}
  
  private static genericLog(ctx: Context, args: (JelObject|null)[], logger: (a: string)=>void): any {
    if (args[args.length-1] instanceof Callable) {
      const msg = Jel.buildMessage(ctx, args, args.length-1);
      logger(msg);
      return (args[args.length-1] as Callable).invoke(ctx, undefined, JelString.valueOf(msg));
    }
    else
      logger(Jel.buildMessage(ctx, args, args.length));
  }
  
  static log_jel_mapping = true
	static log(ctx: Context, args: List): any {
    return Jel.genericLog(ctx, args.elements, m=>console.log(m));
	}

  static error_jel_mapping = true
	static error(ctx: Context, args: List): any {
    return Jel.genericLog(ctx, args.elements, m=>console.error(m));
	}
  
  static same_jel_mapping = true;
	static same(ctx: Context, left: JelObject|null, right: JelObject|null): boolean {
    return Object.is(left, right);
	}

  static sameType_jel_mapping = true;
	static sameType(ctx: Context, left: JelObject|null, right: JelObject|null): boolean {
    if (left == null)
      return right == null;
    return right != null && left.className == right.className;
	}
 
}

BaseTypeRegistry.register('Jel', Jel);


