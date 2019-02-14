import Util from '../util/Util';
import BaseTypeRegistry from './BaseTypeRegistry';
import {IDbSession} from './IDatabase';


/**
 * Manages the context containing all variables.
 */
export default class Context {
	dbSession: IDbSession | undefined;
	translationDict: any; // Dictionary
	
	protected frame: Map<string, any>; // string->JelObject|null
	protected frozen: boolean;
	protected staticScope: boolean;
	
	constructor(public parent?: Context, dbSession?: IDbSession, translationDict?: any) {
		this.dbSession = dbSession || (parent && parent.dbSession);
		this.translationDict = translationDict || (parent && parent.translationDict) || BaseTypeRegistry.get('Dictionary').create();
		this.frame = new Map();
    if (!this.parent)
      this.frame.set('this', "(dummy this)");
		this.frozen = false;
    this.staticScope = false;
	}
	
	get(name: string): any {
		if (this.frame.has(name))
				return this.frame.get(name);
		if (this.parent)
			return this.parent.get(name);
		throw new Error(`Can not read unknown variable ${name}.`);
	}

  // checks whether parent has this in its frame, immediately available
	has(name: string): boolean {
		if (this.frame.has(name))
				return true;
		if (this.parent)
			return this.parent.has(name);
    return false;
	}
  
 	hasInThisScope(name: string): boolean {
		return this.frame.has(name);
	}

 	hasInStaticScope(name: string): boolean {
		return this.hasInThisScope(name) ? this.staticScope : (!!this.parent && this.parent.hasInStaticScope(name));
	}

  
	getOrNull(name: string): any {
		if (this.frame.has(name))
				return this.frame.get(name);
		if (this.parent)
			return this.parent.getOrNull(name);
		return null;
	}
	
	set(name: string, value: any): Context {
		if (this.frozen)
			throw new Error('Can not modify context, already frozen');
 		this.frame.set(name, value);
		return this;
	}
	
	setAll(obj: any, staticScope=false): Context {
		if (obj)
			for (const name in obj) 
				this.set(name, obj[name]);
		return this.freeze(staticScope);
	}
	
	plus(obj: any, staticScope=false): Context {
		if (obj.isIDBSession)
			return new Context(this, obj as IDbSession);
		else if (obj.constructor.name == 'Dictionary')
			return new Context(this, undefined, obj);
		else
			return new Context(this).setAll(obj as any, staticScope);
	}

	getSession(): IDbSession {
		if (!this.dbSession)
			throw new Error("No session available in this Context");
		return this.dbSession;
	}
	
	freeze(staticScope=false): Context {
		this.frozen = true;
    this.staticScope = staticScope;
		return this;
	}
	
	toString(): string {
		const vars = Array.from(this.frame.keys()).map((n: string)=>`${n}=${this.frame.get(n)}`).join(', ');
		return `Context(frame={${vars}}, dbSession=${!!this.dbSession}, translationDict=${!!this.translationDict}, \n   parent=${this.parent})`;
	}
}
