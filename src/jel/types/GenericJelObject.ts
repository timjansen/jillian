import BaseTypeRegistry from '../BaseTypeRegistry';
import Class from './Class';
import Dictionary from './Dictionary';
import JelString from './JelString';
import JelBoolean from './JelBoolean';
import JelObject from '../JelObject';
import Method from './Method';
import Property from './Property';
import TypedParameterValue from '../TypedParameterValue';
import Serializable from '../Serializable';
import Callable from '../Callable';
import Context from '../Context';
import Util from '../../util/Util';

export default class GenericJelObject extends JelObject implements Serializable {
  methodCache: Map<string, Callable> = new Map<string, Callable>();
  
  constructor(clazz: Class, public args: any[], public props: Dictionary) {
    super(clazz.className, clazz);
  }
  
  static forbidNull(value: any): JelObject|Promise<JelObject> {
    return Util.resolveValue(value, v=>{
      if (v == null)
        throw new Error("Operator implementations must not return null");
      return v;
    });
  }
  
  op(ctx: Context, operator: string, right: JelObject|null): JelObject|Promise<JelObject> {
    const m: Method|undefined = (this.clazz as Class).allMethods.elements.get('op'+operator) as any;
    if (m)
      return GenericJelObject.forbidNull(m.callable.invoke(ctx, this, right));
    return super.op(ctx, operator, right);
  }
	
	opReversed(ctx: Context, operator: string, left: JelObject): JelObject|Promise<JelObject> {
    const m: Method|undefined = (this.clazz as Class).allMethods.elements.get('opReversed'+operator) as any;
    if (m)
      return GenericJelObject.forbidNull(m.callable.invoke(ctx, this, left));
    return super.opReversed(ctx, operator, left);
	}
  
	singleOp(ctx: Context, operator: string): JelObject|Promise<JelObject> {
    const m: Method|undefined = (this.clazz as Class).allMethods.elements.get('singleOp'+operator) as any;
    if (m)
      return GenericJelObject.forbidNull(m.callable.invoke(ctx, this));
    return super.singleOp(ctx, operator);
	}

	member(ctx: Context, name: string, parameters?: Map<string, JelObject|null>): JelObject|null|Promise<JelObject|null>|undefined {
    const getter = (this.clazz as Class).allGetters.elements.get(name) as Method;
    if (getter)
      return getter.callable.invoke(ctx, this);
    const propsValue = this.props.elements.get(name);
    if (propsValue !== undefined)
      return propsValue;
    const cachedMethodValue = this.methodCache.get(name);
    if (cachedMethodValue)
      return cachedMethodValue;
    const method = (this.clazz as Class).allMethods.elements.get(name);
    if (method) {
      const m = (method as Method).callable.rebind(this);
      this.methodCache.set(name, m);
      return m;
    }
    return undefined;    
	}
  
  getSerializationProperties(): any[] {
    return this.args;
  }
}
GenericJelObject.prototype.reverseOps = JelObject.SWAP_OPS;

BaseTypeRegistry.register('GenericJelObject', GenericJelObject);

