import MultiNode from './MultiNode';
import TranslatorNode from './TranslatorNode';
import LambdaResultNode from './LambdaResultNode';
import Context from '../Context';
import Util from '../../util/Util';

/**
 * A multi-node for Patterns. noMatchOption is an additional property that can either point to a result, or to another PatternNode.
 */
export default class PatternNode extends MultiNode {
	option: PatternNode | undefined;         // if set, the following nodes are optional
	isEnd: boolean = false;

	constructor() {
		super();
	}

	// override
	match(ctx: Context, tokens: string[], idx: number, metaFilter?: Set<string>, incompleteMatch = false): any {
		const r = super.match(ctx, tokens, idx, metaFilter, incompleteMatch);
		if (r === undefined || incompleteMatch) {
			const r2 = this.isEnd ? Util.addToArray(r, true) : r;
			if (this.option)
				return Util.addToArray(r2, this.option.match(ctx, tokens, idx, metaFilter, incompleteMatch));
			else
				return r2;
		}
		return r;
	}
	
	makeOptional(next: PatternNode) {
		this.option = next;
		return this.append(next);
	}

	makeEnd(): PatternNode {
		this.isEnd = true;
		return this;
	}
	
	merge(translatorNode: TranslatorNode, resultNode: LambdaResultNode) {
		for (const k of this.tokenMap.keys()) { 
			const thisV = this.tokenMap.get(k) as PatternNode;
			const otherV = translatorNode.tokenMap.get(k) as TranslatorNode;
			if (!otherV) {
				const newTn = new TranslatorNode();
				translatorNode.tokenMap.set(k, newTn);
				thisV.merge(newTn, resultNode);
			}
			else if (thisV.isEnd)
				otherV.addResult(resultNode)
			else
				thisV.merge(otherV, resultNode);
		}
				
		if (this.complexNodes) {
			if (!translatorNode.complexNodes)
				translatorNode.complexNodes = [];
			this.complexNodes.forEach(t=>{
				const otherT = translatorNode.complexNodes.find(x=>x.equals(t));
				if (!otherT)
					translatorNode.complexNodes.push(t.merge(resultNode));
				else if (t.next && (t.next as PatternNode).isEnd)
					(otherT.next as TranslatorNode).addResult(resultNode);
				else
					(t.next as PatternNode).merge(otherT.next as TranslatorNode, resultNode);
			});
		}

		if (this.isEnd)  {
			translatorNode.addResult(resultNode);
		}
		else if (this.option)
			this.option.merge(translatorNode, resultNode);
			
		return this;
	}
	
	toString() {
		return `PatterNode(tokens={${Array.from(this.tokenMap.entries()).map(([k,v])=>k+': '+(v||'undefined').toString()).join(',\n')}} complex=[${(this.complexNodes||[]).map(s=>s.toString()).join(',\n')}] option=${(this.option||'undefined').toString()})`;
	}
}

