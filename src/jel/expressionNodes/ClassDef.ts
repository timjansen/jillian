import JelNode from './JelNode';
import Assignment from './Assignment';
import TypedParameterDefinition from './TypedParameterDefinition';
import Lambda from './Lambda';
import JelObject from '../JelObject';
import Runtime from '../Runtime';
import Context from '../Context';
import TypeHelper from '../types/typeDescriptors/TypeHelper';
import LambdaCallable from '../LambdaCallable';
import TypedParameterValue from '../TypedParameterValue';
import Util from '../../util/Util';
import BaseTypeRegistry from '../BaseTypeRegistry';


/**
 * Represents a class definition. 
 *
 * Examples:
 */ 
export default class ClassDef extends JelNode {
  
  constructor(public name: string, public superName?: JelNode, public ctor?: Lambda, public propertyDefs: TypedParameterDefinition[] = [], public methods: Assignment[] = [], public getters: Assignment[] = [], public staticProperties: Assignment[] = []) {
		super();
  }
  
	// override
  execute(ctx: Context): JelObject|null|Promise<JelObject|null> {
    return Util.resolveValues(BaseTypeRegistry.get('Class').create, 
                              ctx, 
                              this.name, 
                              this.superName ? this.superName.execute(ctx) : null, 
                              this.ctor ? this.ctor.execute(ctx) : null,
                              Util.resolveArray(this.propertyDefs.map((p: TypedParameterDefinition)=>p.execute(ctx)), (pl: TypedParameterValue[])=>BaseTypeRegistry.get('List').valueOf(pl)),
                              ClassDef.executeToDictionary(ctx, this.methods),
                              ClassDef.executeToDictionary(ctx, this.getters),
                              ClassDef.executeToDictionary(ctx, this.staticProperties));
	}
                              

  static executeToDictionary(ctx: Context, args: Assignment[]|null): any {
    if (!args || !args.length)
      return BaseTypeRegistry.get('Dictionary').empty;

    const d = new Map<string, JelObject|null>();
    return Util.resolveValue(Util.resolveArray(args.map(a=>a.execute(ctx)), argValues=>argValues.forEach((argValue, i)=>d.set(args[i].name, argValue))), ()=>BaseTypeRegistry.get('Dictionary').valueOf(d, true));
  }
  
	// override
  equals(other?: JelNode): boolean {
		return other instanceof ClassDef &&
      this.name == other.name &&
      (this.superName === other.superName || (!!this.superName && this.superName.equals(other.superName))) &&
      (this.ctor === other.ctor || (!!this.ctor && this.ctor.equals(other.ctor))) &&
      this.propertyDefs.length == other.propertyDefs.length && 
      this.methods.length == other.methods.length && 
      this.getters.length == other.getters.length && 
      this.staticProperties.length == other.staticProperties.length && 
      !this.propertyDefs.find((l, i)=>!l.equals(other.propertyDefs[i])) &&
      !this.methods.find((l, i)=>!l.equals(other.methods[i])) &&
      !this.getters.find((l, i)=>!l.equals(other.getters[i])) &&
      !this.staticProperties.find((l, i)=>!l.equals(other.staticProperties[i]));
	}

	toString(): string {
    let s = `class ${this.name}`
    if (this.superName)
      s += ` extends ${this.superName.toString()}`;
    s+= ':\n';
    
    this.propertyDefs.forEach(a=>{s+=`    ${a.toString()}\n`});
    this.staticProperties.filter(p=>!(p.expression instanceof Lambda)).forEach(a=>{s+=`    static ${a.toString()}\n`});  
    if (this.ctor)
      s+= `    constructor${this.ctor.toArgumentString()}:\n        ${this.ctor.expression.toString()}\n\n`;
    this.getters.forEach(a=>{s+=`    get ${a.name}():\n        ${(a.expression as Lambda).expression.toString()}\n\n`;});
    this.methods.forEach(a=>{s+=`    ${a.name}${(a.expression as Lambda).toArgumentString()}:\n        ${(a.expression as Lambda).expression.toString()}\n\n`;});
    this.staticProperties.filter(p=>p.expression instanceof Lambda).forEach(a=>{s+=`    static ${a.name}${(a.expression as Lambda).toArgumentString()}:\n        ${(a.expression as Lambda).expression.toString()}\n\n`;});
    s+= '\n\n';
    return s;
	}
	
  getSerializationProperties(): Object {
    return [this.name, this.superName, this.propertyDefs, this.methods, this.getters, this.staticProperties];
  }
}

