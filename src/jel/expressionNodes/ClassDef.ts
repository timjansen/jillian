import JelNode from './JelNode';
import Assignment from './Assignment';
import MethodDef from './MethodDef';
import PropertyDef from './PropertyDef';
import TypedParameterDefinition from './TypedParameterDefinition';
import Lambda from './Lambda';
import NativeFunction from './NativeFunction';
import JelObject from '../JelObject';
import Context from '../Context';
import TypedParameterValue from '../TypedParameterValue';
import Util from '../../util/Util';
import BaseTypeRegistry from '../BaseTypeRegistry';
import SourcePosition from '../SourcePosition';
import DeclaringStatement from './DeclaringStatement';


/**
 * Represents a class definition. 
 *
 */ 
export default class ClassDef extends JelNode implements DeclaringStatement {
  isDeclaringStatement = true;
  isNative: boolean;
  
  constructor(position: SourcePosition, public name: string, public superName?: JelNode, public ctor?: Lambda|NativeFunction, public propertyDefs: PropertyDef[] = [], public methodDefs: MethodDef[] = [], 
               public staticPropertyDefs: PropertyDef[] = [], public isAbstract = false, public hasNative = false) {
		super(position, (propertyDefs as JelNode[]).concat(methodDefs, staticPropertyDefs, ctor||[], superName ||[]));
    this.isNative = this.ctor instanceof NativeFunction;
  }
  
	// override
  executeImpl(ctx: Context): JelObject|null|Promise<JelObject|null> {
    const r = Util.resolveValues(BaseTypeRegistry.get('Class').valueOf, 
                              ctx, 
                              this.name, 
                              this.superName ? this.superName.execute(ctx) : null, 
                              this.isAbstract, 
                              this.hasNative ? BaseTypeRegistry.get(this.name) : undefined,
                              this.isNative,
                              this.ctor ? this.ctor.execute(ctx) : null,
                              Util.resolveArray(this.propertyDefs.map((d: PropertyDef)=>d.execute(ctx)), (l: any[])=>BaseTypeRegistry.get('List').valueOf(l)),
                              Util.resolveArray(this.methodDefs.map((d: MethodDef)=>d.execute(ctx)), (l: any[])=>BaseTypeRegistry.get('List').valueOf(l)),
                              Util.resolveArray(this.staticPropertyDefs.map((d: PropertyDef)=>d.execute(ctx)), (l: any[])=>BaseTypeRegistry.get('List').valueOf(l)));
    return r;
	}

  isStatic(): boolean {
    return false;
  }

  flushCache(): void {
    if (this.superName) this.superName.flushCache();
    if (this.ctor) this.ctor.flushCache();
    this.propertyDefs.forEach(a=>a.flushCache());
    this.methodDefs.forEach(a=>a.flushCache());
    this.staticPropertyDefs.forEach(a=>a.flushCache());
  }

  // override
  getCurrentClass(ctx: Context): string|undefined {
    return this.name;
  }
  
	// override
  equals(other?: JelNode): boolean {
		return other instanceof ClassDef &&
      this.name == other.name &&
      this.isAbstract == other.isAbstract &&
      this.hasNative == other.hasNative &&
      (this.superName === other.superName || (!!this.superName && this.superName.equals(other.superName))) &&
      (this.ctor === other.ctor || (!!this.ctor && this.ctor.equals(other.ctor))) &&
      this.propertyDefs.length == other.propertyDefs.length && 
      this.methodDefs.length == other.methodDefs.length && 
      this.staticPropertyDefs.length == other.staticPropertyDefs.length && 
      !this.propertyDefs.find((l, i)=>!l.equals(other.propertyDefs[i])) &&
      !this.methodDefs.find((l, i)=>!l.equals(other.methodDefs[i])) &&
      !this.staticPropertyDefs.find((l, i)=>!l.equals(other.staticPropertyDefs[i]));
	}

	toString(): string {
    let s = `${this.isAbstract ? 'abstract ':''}${this.hasNative? 'native ':''}class ${this.name}`
    if (this.superName)
      s += ` extends ${this.superName.toString()}`;
    s+= ':\n';
    
    this.staticPropertyDefs.forEach((a: PropertyDef)=>{s+=`    static ${a.toString()}\n`});  
    s+='\n';
    this.propertyDefs.forEach((a: PropertyDef)=>{s+=`    ${a.toString()}\n`});
    s+='\n';
    if (this.ctor instanceof NativeFunction)
      s+= `    native constructor${this.ctor.toArgumentString()}\n`;
    else if (this.ctor)
      s+= `    constructor${this.ctor.toArgumentString()} =>\n        ${this.ctor.expression.toString()}\n`;
    s+='\n';
    this.methodDefs.forEach((a: MethodDef)=>{s+=`    ${a.toString()}\n`});
    s+= '\n\n';
    return s;
	}

}

