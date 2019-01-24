import JelObject from '../JelObject';
import Runtime from '../Runtime';
import Callable from '../Callable';
import Context from '../Context';
import JelString from './JelString';
import TypeChecker from './TypeChecker';



/**
 * Collection of static helper methods.
 */
export default class Jel extends JelObject {

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
  
	static throw_jel_mapping = ['msg'];
	static throw(ctx: Context, ...args: (JelObject|null)[]): Promise<Error> {
		return Promise.reject(new Error(Jel.buildMessage(ctx, args, args.length)));
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
  
  static log_jel_mapping = ['msg'];
	static log(ctx: Context, ...args: (JelObject|null)[]): any {
    return Jel.genericLog(ctx, args, m=>console.log(m));
	}

  static error_jel_mapping = ['msg'];
	static error(ctx: Context, ...args: (JelObject|null)[]): any {
    return Jel.genericLog(ctx, args, m=>console.error(m));
	}
  
  static same_jel_mapping = ['left', 'right'];
	static same(ctx: Context, left: JelObject|null, right: JelObject|null): boolean {
    return Object.is(left, right);
	}

  static sameType_jel_mapping = ['left', 'right'];
	static sameType(ctx: Context, left: JelObject|null, right: JelObject|null): boolean {
    if (left == null)
      return right == null;
    return right != null && left.getJelType() == right.getJelType();
	}

  
}



