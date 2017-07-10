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
		// TODO
		
		if (this.word !== tokens[idx]) 
			return false

		return super.match(ctx, tokens, idx);
	}
	
	toString() {
		return `TemplateNode(name=${this.name}, template=${this.template}, hints=[${this.hints.join(', ')}], expression=${this.expression}) => next=${this.next}`;
	}

}

module.exports = TemplateNode;
