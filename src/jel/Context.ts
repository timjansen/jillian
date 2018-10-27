import Util from '../util/Util';
import BaseTypeRegistry from './BaseTypeRegistry';
import {IDbSession} from './IDatabase';


/**
 * Manages the context containing all variables.
 */
export default class Context {
	dbSession: IDbSession | undefined;
	translationDict: any; // Dictionary
	
	private frame: Map<string, any>;
	private frozen: boolean;
	
	constructor(public parent?: Context, dbSession?: IDbSession, translationDict?: any) {
		this.dbSession = dbSession || (parent && parent.dbSession);
		this.translationDict = translationDict || (parent && parent.translationDict) || BaseTypeRegistry.get('Dictionary').create();
		this.frame = new Map();
		this.frozen = false;
	}
	
	get(name: string): any {
		if (this.frame.has(name))
				return this.frame.get(name);
		if (this.parent)
			return this.parent.get(name);
		throw new Error(`Can not read unknown variable ${name}.`);
	}

	getOrNull(name: string): any {
		if (this.frame.has(name))
				return this.frame.get(name);
		if (this.parent)
			return this.parent.get(name);
		return null;
	}
	
	set(name: string, value: any): Context {
		if (this.frozen)
			throw new Error('Can not modify context, already frozen');
		this.frame.set(name, value);
		return this;
	}
	
	setAll(obj: any): Context {
		if (obj)
			for (const name in obj) 
				this.set(name, obj[name]);
		return this.freeze();
	}
	
	getSession(): IDbSession {
		if (!this.dbSession)
			throw new Error("No session available in this Context");
		return this.dbSession;
	}
	
	freeze(): Context {
		this.frozen = true;
		return this;
	}
	
	toString(): string {
		const vars = Array.from(this.frame.keys()).map((n: string)=>`${n}=${this.frame.get(n)}`).join(', ');
		return `Context(frame={${vars}}, dbSession=${!!this.dbSession}, translationDict=${!!this.translationDict}, \n   parent=${this.parent})`;
	}
}
