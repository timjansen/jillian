'use strict';

const TranslationNode = require('./translationnode.js');
const MultiNode = require('./multinode.js');

class TemplateNode extends TranslationNode {

	constructor(template, name, hints, expression, next) {
		super();
		this.template = template;
		this.name = name;
		this.hints = hints;
		this.expression = expression;
		this.next = next; // must be MultiNode
	}
	
	// override
	clone(resultNode) {
		return new TemplateNode(this.template, this.name, this.hints, this.expression, MultiNode.clone(this.next, resultNode));
	}

	// override
	match(ctx, tokens, idx, args) {
		if (!ctx.translationDict || !ctx.translationDict.get)
			throw new Error("Templates in patterns require 'translationDict' in Context");
		
		const tpl = ctx.translationDict.get(this.template);
		if (!tpl)
			throw new Error(`Can not find template ${this.template} in given translation dictionary`);

		const r = tpl.match(ctx, tokens, idx);
		if (r) {
			const [val, newIdx]  = r;
	
			if (args && this.name)
				args[this.name] = val;
		
			return this.matchNext(ctx, tokens, newIdx, args);
		}
		return undefined;
	}
	
	// override
	collectArgumentNames(dest) {
		if (this.name)
			dest.push(this.name);
		return super.collectArgumentNames(dest);
	}
	
	equals(other) {
		return this.template == other.template && this.name == other.name && this.hints.join(',') == other.hints.join(',') &&
		((!this.expression) === (!other.expression)) && ((!this.expression) || this.expression.equals(other.expression));
	}
	
	toString() {
		return `TemplateNode(name=${this.name}, template=${this.template}, hints=[${this.hints.join(', ')}], expression=${!!this.expression}) => next=${this.next}`;
	}

}

module.exports = TemplateNode;
