import Match from './Match';
import MatchNode from './MatchNode';
import Context from '../Context';
import Dictionary from '../types/Dictionary';
import Serializer from '../Serializer';
import JelNode from '../expressionNodes/JelNode';

export default class LambdaResultNode extends MatchNode {

	constructor(public expression: JelNode, public meta?: Dictionary) {
		super('LambdaResultNode');
	}
	
	private createMatch(result: any, idx: number): Match | Promise<Match> {
		if (result instanceof Promise)
			return result.then(r=>this.createMatch(r, idx));
		else
			return new Match(result, idx, this.meta);
	}
	
	// override
	match(ctx: Context, tokens: string[], idx: number, metaFilter?: Set<string>, incompleteMatch = false): Match | Promise<Match> | undefined {
		if (metaFilter && metaFilter.size) {
			if (!this.meta || metaFilter.size > this.meta.size)
				return;
			for (const key of metaFilter.values())
				if (!this.meta.elements.has(key))
					return;
		}
		return this.createMatch(this.expression.execute(ctx), idx);
	}
	
	// override
	toString(): string {
		if (this.meta && this.meta.size) {
			return `LambdaResultNode(${this.expression}, meta={${Array.from(this.meta.elements.keys()).map(k=>`${k}=${this.meta?Serializer.serialize(this.meta.elements.get(k)):''}`).join(', ')}})`;
		}
		else
			return `LambdaResultNode(${this.expression})`;
	}
}
