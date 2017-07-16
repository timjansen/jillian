'use strict';

const PatternNode = require('./patternnode.js');

class TemplateNode extends PatternNode {

	constructor(template, name, hints, expression, next) {
		super(next);
		this.template = template;
		this.name = name;
		this.hints = hints;
		this.expression = expression;
	}
	
	match(ctx, tokens, idx) {
		if (!ctx.translationDict || !ctx.translationDict.get)
			throw new Error("Templates in patterns require 'translationDict' in Context");
		
		const tpl = ctx.translationDict.get(this.template);
		if (!tpl)
			throw new Error(`Can not find template ${this.template} in given translation dictionary`);

		const val = tpl.match(ctx, tokens, idx);
				
		

		return super.match(ctx, tokens, idx);
	}
	
	collectArgumentNames(dest) {
		if (this.name)
			dest.push(this.name);
		return super.collectArgumentNames(dest);
	}
	
	toString() {
		return `TemplateNode(name=${this.name}, template=${this.template}, hints=[${this.hints.join(', ')}], expression=${!!this.expression}) => next=${this.next}`;
	}

}

module.exports = TemplateNode;
