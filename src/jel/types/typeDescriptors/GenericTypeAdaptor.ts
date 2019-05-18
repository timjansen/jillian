import Class from "../Class";
import TypeDescriptor from "./TypeDescriptor";
import JelObject from "../../JelObject";
import Context from "../../Context";
import JelBoolean from "../JelBoolean";
import GenericJelObject from "../GenericJelObject";
import Runtime from "../../Runtime";
import RuntimeError from "../RuntimeError";
import Util from "../../../util/Util";

export default class GenericTypeAdaptor extends TypeDescriptor {
    clazz: Class;
    typeChecked: boolean;
  
    constructor(public obj: GenericJelObject) {
      super(obj.className);
      this.clazz = obj.clazz;
    }

    member(ctx: Context, name: string): any {
      return this.obj.member(ctx, name);
    }
    method(ctx: Context, name: string): any {
      return this.obj.method(ctx, name);
    }

    checkGenericObject(ctx: Context): GenericJelObject {
      if (this.typeChecked)
        return this.obj;
      if (!Runtime.isClassCompatible(ctx, this.obj.clazz, 'TypeDescriptor'))
        throw new RuntimeError(`Class ${this.obj.className} can not be used as a TypeDescriptor`);
      this.typeChecked = true;
      return this.obj;
    }

    checkType(ctx: Context, value: JelObject | null): JelBoolean | Promise<JelBoolean> {
      const obj = this.checkGenericObject(ctx);
      return obj.method(ctx, 'checkType')!.invoke(obj, value) as any;
    }

    convert(ctx: Context, value: JelObject|null, fieldName=''): JelObject|null|Promise<JelObject|null> {
      const obj = this.checkGenericObject(ctx);
      return obj.method(ctx, 'convert')!.invoke(obj, value) as any;
    }

    equals(ctx: Context, other: TypeDescriptor | null): JelBoolean | Promise<JelBoolean> {
      const obj = this.checkGenericObject(ctx);
      return obj.method(ctx, 'equals')!.invoke(obj, other) as any;
    }

    serializeType(): string {
      return this.obj.toString();
    }
  }
