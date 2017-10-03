import MultiNode from './MultiNode';
import LambdaResultNode from './LambdaResultNode';
import Context from '../Context';
import Util from '../../util/Util';

/**
 * A multi-node for Translators. They can have multiple LambdaResultNodes.
 */
export default class TranslatorNode extends MultiNode {
	results: LambdaResultNode[] | undefined;
	
	constructor() {
		super();
	}

	// override
	match(ctx: Context, tokens: string[], idx: number, metaFilter?: Set<string> | undefined, incompleteMatch = false): any {
		const m = super.match(ctx, tokens, idx, metaFilter, incompleteMatch);
		if (this.results && (incompleteMatch || !tokens[idx]))
			return Util.addToArray(m, Util.collect(this.results, r=>r.match(ctx, tokens, idx, metaFilter, incompleteMatch)));
		return m;
	}
	
	addResult(result: LambdaResultNode): TranslatorNode {
		if (!this.results)
			this.results = [result];
		else
			this.results.push(result);
		return this;
	}

	
	toString(): string {
		const v = [`tokens={${Array.from(this.tokenMap.entries()).map(([k,v])=>k+': '+(v||'undefined').toString()).join(',\n')}}`];
		if (this.complexNodes)
			v.push(`complex=[${this.complexNodes.map(s=>s.toString()).join(',\n')}]`);
		if (this.results)
			v.push(`results=[${this.results.join(', ')}]`);
		return `TranslatorNode(${v.join(' ')})`;
	}
}

