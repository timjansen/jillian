import MatchNode from './MatchNode';
import MultiNode from './MultiNode';
import PatternNode from './PatternNode';
import ComplexNode from './ComplexNode';
import LambdaResultNode from './LambdaResultNode';

import TranslatorNode from './TranslatorNode';
import JelNode from '../expressionNodes/JelNode';
import List from '../List';
import Context from '../Context';
import Util from '../../util/Util';

export default class RegExpNode extends ComplexNode {

	constructor(public regexps: RegExp[], name?: string, expression?: JelNode, next?: MultiNode) {
		super(name, expression, next);
	}
	
	merge(resultNode: LambdaResultNode): RegExpNode {
		const newMulti = new TranslatorNode();
		const t = new RegExpNode(this.regexps, this.name, this.expression, newMulti);
		(this.next as PatternNode).merge(newMulti, resultNode);
		return t;
	}
	
	// override
	match(ctx: Context, tokens: string[], idx: number, metaFilter?: Set<string>, incompleteMatch = false): any {
		let matches: Array<string|List> = [];
		for (let i = 0; i < this.regexps.length; i++) {
			const token = tokens[idx+i];
			if (!token)
				return undefined;
			const m = this.regexps[i].exec(token);
			if (!m)
				return undefined;
			
			if (m.length == 1)
				matches.push(m[0]);
			else
				matches.push(new List(m.slice(1)));
		}

		const newCtx = this.name ? new Context(ctx) : ctx;
		
		if (this.name) {
			if (matches.length < 2)
				newCtx.set(this.name, matches[0]).freeze();
			else
				newCtx.set(this.name, new List(matches)).freeze();
		}
		
		if (this.expression) {
			const result = this.expression.execute(newCtx);
			if (!result)
				return undefined;
			else if (result instanceof Promise)
				return result.then(r=>r ? this.next!.match(newCtx, tokens, idx + this.regexps.length, metaFilter, incompleteMatch) : undefined);
		}
		return this.next!.match(newCtx, tokens, idx + this.regexps.length, metaFilter, incompleteMatch);
	}
	
	equals(other: RegExpNode): boolean {
		return this.regexps.map(r=>r.source).join(",") == other.regexps.map(r=>r.source).join(",") && 
				this.name == other.name && 
				((!this.expression) === (!other.expression)) && 
				((!this.expression) || this.expression.equals(other.expression!));
	}
	
	toString(): string {
		return `RegExpNode(name=${this.name}, regexps=${this.regexps.map(r=>'/'+r.source+'/').join(", ")}, expression=${this.expression}) -> ${this.next}`;
	}

}
