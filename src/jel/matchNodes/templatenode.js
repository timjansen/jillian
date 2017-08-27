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
	match(ctx, tokens, idx, args, metaFilter, incompleteMatch) {
		if (!ctx.translationDict || !ctx.translationDict.get)
			throw new Error("Templates in patterns require 'translationDict' in Context");
		
		const template = ctx.translationDict.get(this.template);
		if (!template)
			throw new Error(`Can not find template ${this.template} in translation dictionary`);

		const r = template.matchAtPosition(ctx, tokens, idx, this.metaFilter, true);
		if (r) {
			const tplCtx = new Context(args, ctx);
			const m = Util.collect(r, match=> {
				if (args && this.name) {
					args[this.name] = match.value;
					args[this.name + '_meta'] = new Dictionary(match.meta, true);
				}
				if (this.expression) {
					const result = this.expression.execute(tplCtx)
					if (!result)
						return null;
					else if (!(result instanceof Promise))
						return this.next.match(ctx, tokens, match.index, args, this.metaFilter, incompleteMatch);
					else
						throw new Error('missing Promise handling'); // TODO: missing Promise handling		
				}
				return this.next.match(ctx, tokens, match.index, args, this.metaFilter, incompleteMatch);
			});
			if (m.length)
				return m;
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
		return this.template == other.template && this.name == other.name && Array.from(this.metaFilter||[]).join(',') == Array.from(other.metaFilter||[]).join(',') &&
		((!this.expression) === (!other.expression)) && ((!this.expression) || this.expression.equals(other.expression));
	}
	
	toString() {
		return `TemplateNode(name=${this.name}, template=${this.template}, metaFilter=[${Array.from(this.metaFilter||[]).join(', ')}], expression=${this.expression}) -> ${this.next}`;
	}

}

module.exports = TemplateNode;
