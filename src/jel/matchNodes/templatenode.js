'use strict';

const MatchNode = require('./matchnode.js');
const TranslatorNode = require('./translatornode.js');
const Dictionary = require('../dictionary.js');
const Context = require('../context.js');
const Util = require('../../util/util.js');

class TemplateNode extends MatchNode {

	constructor(template, name, metaFilter, expression, next) {
		super();
		this.template = template;
		this.name = name;
		this.metaFilter = new Set(metaFilter);
		this.expression = expression;
		this.next = next; // must be MultiNode
	}
	
	merge(resultNode) {
		const newMulti = new TranslatorNode();
		const t = new TemplateNode(this.template, this.name, this.metaFilter, this.expression, newMulti);
		this.next.merge(newMulti, resultNode);
		return t;
	}
	
	append(next) {
		this.next = next;
	}
	
	// override
	match(ctx, tokens, idx, metaFilter, incompleteMatch) {
		if (!ctx.translationDict || !ctx.translationDict.get)
			throw new Error("Templates in patterns require 'translationDict' in Context");
		
		const template = ctx.translationDict.get(this.template);
		if (!template)
			throw new Error(`Can not find template ${this.template} in translation dictionary`);

		const templateMatches = template.matchAtPosition(ctx, tokens, idx, this.metaFilter, true);

		return Util.resolveNestedValues(templateMatches, match=>{
			const tplCtx = this.name ? new Context(ctx) : ctx;
			if (this.name)
				tplCtx.set(this.name, match.value) 
							.set(this.name + '_meta', new Dictionary(match.meta, true))
							.freeze();

			if (this.expression) {
				const result = this.expression.execute(tplCtx)
				if (!result)
					return null;
				else if (result instanceof Promise)
					return result.then(r=>r ? this.next.match(tplCtx, tokens, match.index, this.metaFilter, incompleteMatch) : undefined);
			}
			return this.next.match(tplCtx, tokens, match.index, this.metaFilter, incompleteMatch);
		});
	}
	
	equals(other) {
		return this.template == other.template && this.name == other.name && Array.from(this.metaFilter||[]).join(',') == Array.from(other.metaFilter||[]).join(',') &&
		((!this.expression) === (!other.expression)) && ((!this.expression) || this.expression.equals(other.expression));
	}
	
	toString() {
		return `TemplateNode(name=${this.name}, template=${this.template}, metaFilter=[${Array.from(this.metaFilter||[]).join(', ')}], expression=${this.expression}) -> ${this.next}`;
	}

}

module.exports = TemplateNode;
