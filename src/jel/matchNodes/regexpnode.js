'use strict';

const MatchNode = require('./matchnode.js');
const TranslatorNode = require('./translatornode.js');
const List = require('../list.js');
const Context = require('../context.js');
const Util = require('../../util/util.js');

class RegExpNode extends MatchNode {

	constructor(regexps, name, expression, next) {
		super();
		this.regexps = regexps; // array of RegExps
		this.name = name;
		this.expression = expression;
		this.next = next; // must be MultiNode
	}
	
	merge(resultNode) {
		const newMulti = new TranslatorNode();
		const t = new RegExpNode(this.regexps, this.name, this.expression, newMulti);
		this.next.merge(newMulti, resultNode);
		return t;
	}
	
	append(next) {
		this.next = next;
	}
	
	// override
	match(ctx, tokens, idx, metaFilter, incompleteMatch) {
		let matches = [];
		for (let i = 0; i < this.regexps.length; i++) {
			const token = tokens[idx+i];
			if (!token)
				return undefined;
			const m = this.regexps[i].exec(token);
			if (!m)
				return undefined;
			
			if (m.length == 1)
				matches.push(m[0]);
			else
				matches.push(new List(m.slice(1)));
		}

		const newCtx = this.name ? new Context(ctx) : ctx;
		
		if (this.name) {
			if (matches.length < 2)
				newCtx.set(this.name, matches[0]).freeze();
			else
				newCtx.set(this.name, new List(matches)).freeze();
		}
		
		if (this.expression) {
			const result = this.expression.execute(newCtx);
			if (!result)
				return undefined;
			else if (result instanceof Promise)
				return result.then(r=>r ? this.next.match(newCtx, tokens, idx + this.regexps.length, this.metaFilter, incompleteMatch) : undefined);
		}
		return this.next.match(newCtx, tokens, idx + this.regexps.length, this.metaFilter, incompleteMatch);
	}
	
	equals(other) {
		return this.regexps.map(r=>r.source).join(",") == other.regexps.map(r=>r.source).join(",") && this.name == other.name && ((!this.expression) === (!other.expression)) && ((!this.expression) || this.expression.equals(other.expression));
	}
	
	toString() {
		return `RegExpNode(name=${this.name}, regexps=${this.regexps.map(r=>'/'+r.source+'/').join(", ")}, expression=${this.expression}) -> ${this.next}`;
	}

}

module.exports = RegExpNode;
