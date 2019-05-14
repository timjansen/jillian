import BaseTypeRegistry from '../BaseTypeRegistry';
import Context from '../Context';
import Class from './Class';
import List from './List';
import NativeJelObject from './NativeJelObject';
import TypeChecker from './TypeChecker';
import Runtime from '../Runtime';
import TypeHelper from './typeDescriptors/TypeHelper';
import JelString from './JelString';


export default class RuntimeError extends NativeJelObject {
  message_jel_property: boolean;
  nativeStack_jel_property: boolean;
  stack_jel_property: boolean;

  static clazz: Class|undefined;

  constructor(public message: string, public nativeStack?: string, public stack: List = List.empty) {
    super('RuntimeError');
  
  }
  
  addStackEntry_jel_mapping: boolean;
  addStackEntry(ctx: Context, entry: any) {
    return new RuntimeError(this.message, this.nativeStack, this.stack.add(ctx, entry));
  }

  addStackEntryJs(ctx: Context, entry: string) {
    return new RuntimeError(this.message, this.nativeStack, this.stack.add(ctx, JelString.valueOf(entry)));
  }

  get clazz(): Class {
    return RuntimeError.clazz!;
  }  
  
  getSerializationProperties(): any[] {
    return [this.message, this.nativeStack, this.stack];
  }

  toString(): string {
    return `${this.message}\n at ${this.stack.elements.map(s=>s.value).join('\n at ')}`;
  }

  static valueOf(message: string, nativeStack: string, stackFrame: string) {
    return new RuntimeError(message, nativeStack, stackFrame ? new List([JelString.valueOf(stackFrame)]) : List.empty);
  }
}

RuntimeError.prototype.message_jel_property = true;
RuntimeError.prototype.nativeStack_jel_property = true;
RuntimeError.prototype.stack_jel_property = true;
RuntimeError.prototype.addStackEntry_jel_mapping = true;

BaseTypeRegistry.register('RuntimeError', RuntimeError);

