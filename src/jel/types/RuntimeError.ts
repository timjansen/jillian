import BaseTypeRegistry from '../BaseTypeRegistry';
import Context from '../Context';
import Class from './Class';
import List from './List';
import NativeJelObject from './NativeJelObject';
import TypeChecker from './TypeChecker';
import Runtime from '../Runtime';


export default class RuntimeError extends NativeJelObject {
  message_jel_property: boolean;
  nativeStack_jel_property: boolean;
  stack_jel_property: boolean;

  static clazz: Class|undefined;

  constructor(public message: string, public nativeStack: string|undefined, public stack: List) {
    super('RuntimeError');
  
  }
  
  addStackFrame_jel_mapping: boolean;
  addStackFrame(ctx: Context, stackFrame: any) {
    return new RuntimeError(this.message, this.nativeStack, this.stack.add(ctx, stackFrame));
  }

  get clazz(): Class {
    return RuntimeError.clazz!;
  }  
  
  getSerializationProperties(): any[] {
    return [this.message, this.nativeStack, this.stack];
  }

  static valueOf(message: string, nativeStack: string, stackFrame: string) {
    return new RuntimeError(message, nativeStack, new List([stackFrame]));
  }
}

RuntimeError.prototype.message_jel_property = true;
RuntimeError.prototype.nativeStack_jel_property = true;
RuntimeError.prototype.stack_jel_property = true;
RuntimeError.prototype.addStackFrame_jel_mapping = true;

BaseTypeRegistry.register('RuntimeError', RuntimeError);

