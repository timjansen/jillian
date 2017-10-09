import Util from '../util/Util';
import Dictionary from './Dictionary';

/**
 * Manages the context containing all variables.
 */
export default class Context {
	dbSession: any;
	translationDict: Dictionary;
	
	private frame: Object;
	private frozen: boolean;
	
	constructor(public parent?: Context, dbSession?: any, translationDict?: Dictionary) {
		this.dbSession = dbSession || (parent && parent.dbSession);
		this.translationDict = translationDict || (parent && parent.translationDict) || new Dictionary();
		this.frame = {};
		this.frozen = false;
	}
	
	get(name: string): any {
		if (this.frame.hasOwnProperty(name))
				return this.frame[name];
		if (this.parent)
			return this.parent.get(name);
		throw new Error(`Can not read unknown variable ${name}.\n${this.toString()}`);
	}
	
	set(name: string, value: any): Context {
		if (this.frozen)
			throw new Error('Can not modify context, already frozen');
		this.frame[name] = value;
		return this;
	}
	
	setAll(obj: Object): Context {
		if (obj)
			for (const name in obj) 
				this.set(name, obj[name]);
		return this.freeze();
	}
	
	freeze(): Context {
		this.frozen = true;
		return this;
	}
	
	toString(): string {
		const vars = Util.propertyNames(this.frame).map(n=>`${n}=${this.frame[n]}`).join(', ');
		return `Context(frame={${vars}}, dbSession=${!!this.dbSession}, translationDict=${!!this.translationDict}, \n   parent=${this.parent})`;
	}
}
