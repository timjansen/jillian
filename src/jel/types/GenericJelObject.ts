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
  private _clazz: Class;
  
  constructor(clazz: Class, public args: any[], public props: Dictionary) {
    super(clazz.name);
    this._clazz = clazz;
  }
  
  get clazz(): Class {
    return this._clazz;
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
      return GenericJelObject.forbidNull(m.callable.invoke(this, right));
    return super.op(ctx, operator, right);
  }
	
	opReversed(ctx: Context, operator: string, left: JelObject): JelObject|Promise<JelObject> {
    const m: Method|undefined = (this.clazz as Class).allMethods.elements.get('opReversed'+operator) as any;
    if (m)
      return GenericJelObject.forbidNull(m.callable.invoke(this, left));
    return super.opReversed(ctx, operator, left);
	}
  
	singleOp(ctx: Context, operator: string): JelObject|Promise<JelObject> {
    const m: Method|undefined = (this.clazz as Class).allMethods.elements.get('singleOp'+operator) as any;
    if (m)
      return GenericJelObject.forbidNull(m.callable.invoke(this));
    return super.singleOp(ctx, operator);
	}

	member(ctx: Context, name: string): JelObject|null|Promise<JelObject|null>|undefined {
    const getter = (this.clazz as Class).allGetters.elements.get(name) as Method;
    if (getter)
      return getter.callable.invoke(this);
    const propsValue = this.props.elements.get(name);
    if (propsValue !== undefined)
      return propsValue;
    const method = (this.clazz as Class).allMethods.elements.get(name);
    if (method)
      return (method as Method).callable.rebind(this);
    return undefined;    
	}
  
 
  getSerializationProperties(): any[] {
    return this.args;
  }
}
GenericJelObject.prototype.reverseOps = JelObject.SWAP_OPS;

BaseTypeRegistry.register('GenericJelObject', GenericJelObject);

