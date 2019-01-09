import JelNode from './JelNode';
import Assignment from './Assignment';
import TypedParameterDefinition from './TypedParameterDefinition';
import Lambda from './Lambda';
import JelObject from '../JelObject';
import Context from '../Context';
import TypedParameterValue from '../TypedParameterValue';
import Util from '../../util/Util';
import BaseTypeRegistry from '../BaseTypeRegistry';


/**
 * Represents a class definition. 
 *
 * Examples:
 */ 
export default class ClassDef extends JelNode {
  
  constructor(public name: string, public superName?: JelNode, public ctor?: Lambda, public propertyDefs: TypedParameterDefinition[] = [], public methods: Assignment[] = [], public getters: Assignment[] = [], public staticProperties: Assignment[] = [], 
              public isAbstract = false) {
		super();
  }
  
	// override
  execute(ctx: Context): JelObject|null|Promise<JelObject|null> {
    const baseCtx = BaseTypeRegistry.get('DefaultContext').get();
    const staticStaticProperties: Assignment[] = [];
    const unstaticStaticProperties: Assignment[] = [];
    this.staticProperties.forEach(a=>(a.isStatic(baseCtx)?staticStaticProperties:unstaticStaticProperties).push(a));
    
    return Util.resolveValues(BaseTypeRegistry.get('Class').create, 
                              ctx, 
                              this.name, 
                              this.superName ? this.superName.execute(ctx) : null, 
                              this.ctor ? this.ctor.execute(ctx) : null,
                              Util.resolveArray(this.propertyDefs.map((p: TypedParameterDefinition)=>p.execute(ctx)), (pl: TypedParameterValue[])=>BaseTypeRegistry.get('List').valueOf(pl)),
                              ClassDef.executeToDictionary(ctx, this.methods),
                              ClassDef.executeToDictionary(ctx, this.getters),
                              ClassDef.executeToDictionary(ctx, staticStaticProperties),
                              unstaticStaticProperties.length ? BaseTypeRegistry.get('List').valueOf(unstaticStaticProperties).toDictionaryJs((l: Assignment)=>l.name).mapJs((k:string, l: Assignment)=>l.asCallable()) : BaseTypeRegistry.get('Dictionary').empty,
                              this.isAbstract);
	}
                              

  static executeToDictionary(ctx: Context, args: Assignment[]): any {
    if (!args.length)
      return BaseTypeRegistry.get('Dictionary').empty;

    const d = new Map<string, JelObject|null>();
    return Util.resolveValue(Util.resolveArray(args.map(a=>a.execute(ctx)), argValues=>argValues.forEach((argValue, i)=>d.set(args[i].name, argValue))), ()=>BaseTypeRegistry.get('Dictionary').valueOf(d, true));
  }
  
  isStatic(): boolean {
    return false;
  }

  flushCache(): void {
    if (this.superName) this.superName.flushCache();
    if (this.ctor) this.ctor.flushCache();
    this.propertyDefs.forEach(a=>a.flushCache());
    this.methods.forEach(a=>a.flushCache());
    this.getters.forEach(a=>a.flushCache());
    this.staticProperties.forEach(a=>a.flushCache());
    this.staticProperties.forEach(a=>a.flushCache());
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
      s+= `    constructor${this.ctor.toArgumentString()} =>\n        ${this.ctor.expression.toString()}\n\n`;
    this.getters.forEach(a=>{s+=`    get ${a.name}()${(a.expression as Lambda).toReturnString()} =>\n        ${(a.expression as Lambda).expression.toString()}\n\n`;});
    this.methods.forEach(a=>{s+=`    ${a.name}${(a.expression as Lambda).toArgumentString()}${(a.expression as Lambda).toReturnString()} =>\n        ${(a.expression as Lambda).expression.toString()}\n\n`;});
    this.staticProperties.filter(p=>p.expression instanceof Lambda).forEach(a=>{s+=`    static ${a.name}${(a.expression as Lambda).toArgumentString()}${(a.expression as Lambda).toReturnString()} =>\n        ${(a.expression as Lambda).expression.toString()}\n\n`;});
    s+= '\n\n';
    return s;
	}
	
  getSerializationProperties(): Object {
    return [this.name, this.superName, this.propertyDefs, this.methods, this.getters, this.staticProperties];
  }
}

