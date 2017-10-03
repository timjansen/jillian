import MatchNode from './MatchNode';
import ComplexNode from './ComplexNode';
import RegExpNode from './RegExpNode';
import Context from '../Context';
import Util from '../../util/Util';

export default abstract class MultiNode extends MatchNode {
	tokenMap: Map<string, MultiNode> = new Map(); // Map: token (string) -> next node
	complexNodes: ComplexNode[] | undefined;       // Array: list of template or regexp nodes to check
	
	constructor() {
		super();
	}
	
	addTokenMatch(token: string, nextNode: MultiNode) {
		this.tokenMap.set(token, nextNode);
		return this;
	}

	addTemplateMatch(complexNode: ComplexNode) {
		if (!this.complexNodes)
			this.complexNodes = [complexNode];
		else
			this.complexNodes.push(complexNode);
		return this;
	}

	// override
	match(ctx: Context, tokens: string[], idx: number, metaFilter?: Set<string> | undefined, incompleteMatch = false): any {
		let result;
		const tr = this.tokenMap.get(tokens[idx]);
		if (tr)
			result = Util.addToArray(result, tr.match(ctx, tokens, idx+1, metaFilter, incompleteMatch));

		if (this.complexNodes) {
			for (const t of this.complexNodes) 
				result = Util.addToArray(result, t.match(ctx, tokens, idx, metaFilter, incompleteMatch));
		}
		return result;
	}
	
	// override
	append(next: MultiNode): MultiNode {
		for (const k of this.tokenMap.keys()) {
			const v = this.tokenMap.get(k);
			if (v)
				v.append(next);
			else
				this.tokenMap.set(k, next);
		}

		if (this.complexNodes)
			this.complexNodes.forEach(n=>n.append(next));

		return this;
	}
	
	toString(): string {
		return `MultiNode(tokens={${Array.from((this.tokenMap||new Map()).entries()).map(([k,v])=>k+': '+(v||'undefined').toString()).join(',\n')}} templates=[${(this.complexNodes||[]).map(s=>s.toString()).join(',\n')}])`;
	}
}

