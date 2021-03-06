import MatchNode from './MatchNode';
import MultiNode from './MultiNode';
import PatternNode from './PatternNode';
import ComplexNode from './ComplexNode';
import TranslatorNode from './TranslatorNode';
import LambdaResultNode from './LambdaResultNode';
import JelNode from '../expressionNodes/JelNode';
import BaseTypeRegistry from '../BaseTypeRegistry';
import Context from '../Context';
import Util from '../../util/Util';

export default class TemplateNode extends ComplexNode {

	constructor(public template: string, name?: string, public metaFilter?: Set<string>, expression?: JelNode, next?: MultiNode) {
		super('TemplateNode', name, expression, next);
	}
	
	merge(resultNode: LambdaResultNode): ComplexNode {
		const newMulti = new TranslatorNode();
		const t = new TemplateNode(this.template, this.name, this.metaFilter, this.expression, newMulti);
		(this.next as PatternNode).merge(newMulti, resultNode);
		return t;
	}

	// override
	match(ctx: Context, tokens: string[], idx: number, metaFilter?: Set<string>, incompleteMatch = false): any {
		return Util.resolveValue(ctx.get(this.template), template=>{
			if (!template)
				throw new Error(`Can not find template "${this.template}" in context`);

			const templateMatches = template.matchAtPosition(ctx, tokens, idx, this.metaFilter, true);

			return Util.resolveNestedValues(templateMatches, match=>{
				const tplCtx = this.name ? new Context(ctx) : ctx;
				if (this.name)
					tplCtx.set(this.name, match.value) 
								.set(this.name + '_meta', BaseTypeRegistry.get('Dictionary').valueOf(match.meta, true))
								.freeze();

				if (this.expression) {
					const result = this.expression.execute(tplCtx)
					if (!this.isResultTrue(result))
						return null;
					else if (result instanceof Promise)
						return result.then(r=>this.isResultTrue(r) ? this.next!.match(tplCtx, tokens, match.index, this.metaFilter, incompleteMatch) : undefined);
				}
				return this.next!.match(tplCtx, tokens, match.index, this.metaFilter, incompleteMatch);
			});
		});
	}
	
	equals(other: TemplateNode): boolean {
		return this.template == other.template && this.name == other.name && Array.from(this.metaFilter||[]).join(',') == Array.from(other.metaFilter||[]).join(',') &&
		((!this.expression) === (!other.expression)) && ((!this.expression) || this.expression.equals(other.expression!));
	}
	
	toString(): string {
		return `TemplateNode(name=${this.name}, template=${this.template}, metaFilter=[${Array.from(this.metaFilter||[]).join(', ')}], expression=${this.expression}) -> ${this.next}`;
	}

}

