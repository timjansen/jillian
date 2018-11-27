import Runtime from '../Runtime';
import JelObject from '../JelObject';
import BaseTypeRegistry from '../BaseTypeRegistry';
import {Token} from '../Token';
import TokenReader from '../TokenReader';
import SerializablePrimitive from '../SerializablePrimitive';
import Context from '../Context';
import JelBoolean from './JelBoolean';
import JelString from './JelString';
import PatternNode from '../patternNodes/PatternNode';
import Util from '../../util/Util';
import TypeChecker from './TypeChecker';

export default class Pattern extends JelObject implements SerializablePrimitive {
	
	constructor(public tree: PatternNode, public patternText: string) {
		super();
	}
	
	// returns Promise!
	matchPromise(ctx: Context, inputOrTokens: string | string[]): Promise<JelBoolean> {
		return Promise.resolve(this.match(ctx, inputOrTokens));
	}

	match_jel_mapping: Object;
	match(ctx: Context, inputOrTokens0: any): JelBoolean | Promise<JelBoolean> {
		if (inputOrTokens0 instanceof JelString)
			return this.match(ctx, inputOrTokens0.value);
		if (typeof inputOrTokens0 == 'string') {
			const trimmed = inputOrTokens0.trim();
			return this.match(ctx, trimmed ? trimmed.split(/\s+/g) : []);
		}
		if (!Array.isArray(inputOrTokens0) && ((inputOrTokens0 instanceof JelObject) || inputOrTokens0 == null))
			return TypeChecker.throwArgumentError(inputOrTokens0, 'inputOrTokens', 'string');	
		
		const inputOrTokens: string[] = inputOrTokens0;
		const p = this.tree.match(ctx, inputOrTokens, 0);

		if (!p)
			return JelBoolean.FALSE;
		else if (p instanceof Promise || (Array.isArray(p) && Util.hasRecursive(p, p=>p instanceof Promise)))
			return Util.simplifyPromiseArray(p).then(p0=>JelBoolean.valueOf(!!p0.length));
		else
			return JelBoolean.valueOf((!Array.isArray(p)) || !!p.length);
	}

	equals(other: any): boolean {
		return (other instanceof Pattern) && other.patternText == this.patternText;
	}
	
	serializeToString(pretty: boolean, indent: number, spaces: string) : string {
		return '`' + this.patternText.replace(/`/g, '\\`') + '`';
	}
	
	toString(): string {
		return `\`${this.patternText}\``;
	}
	
	static valueOf(tree: PatternNode, patternText: string): Pattern {
		return new Pattern(tree, patternText);
	}
	
}

Pattern.prototype.match_jel_mapping = ['input'];

BaseTypeRegistry.register('Pattern', Pattern);

