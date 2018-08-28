import JelType from '../JelType';
import {Token} from '../Token';
import TokenReader from '../TokenReader';
import Context from '../Context';
import FuzzyBoolean from './FuzzyBoolean';
import PatternNode from '../patternNodes/PatternNode';
import Util from '../../util/Util';

export default class Pattern extends JelType {
	
	constructor(public tree: PatternNode, public patternText: string) {
		super();
	}
	
	// returns Promise!
	matchPromise(ctx: Context, inputOrTokens: string | string[]): Promise<FuzzyBoolean> {
		return Promise.resolve(this.match(ctx, inputOrTokens));
	}

	match_jel_mapping: Object;
	match(ctx: Context, inputOrTokens: string | string[]): FuzzyBoolean | Promise<FuzzyBoolean> {
		if (typeof inputOrTokens == 'string') {
			const trimmed = inputOrTokens.trim();
			return this.match(ctx, trimmed ? trimmed.split(/\s+/g) : []);
		}
		const p = this.tree.match(ctx, inputOrTokens, 0);

		if (!p)
			return FuzzyBoolean.FALSE;
		else if (p instanceof Promise || (Array.isArray(p) && Util.hasRecursive(p, p=>p instanceof Promise)))
			return Util.simplifyPromiseArray(p).then(p0=>FuzzyBoolean.toFuzzyBoolean(!!p0.length));
		else
			return FuzzyBoolean.toFuzzyBoolean((!Array.isArray(p)) || !!p.length);
	}

	equals(other: any): boolean {
		return (other instanceof Pattern) && other.patternText == this.patternText;
	}
	
	toString(): string {
		return `Pattern(text=\`${this.patternText}\`)`;
	}
	
}

Pattern.prototype.match_jel_mapping = {input: 1};

