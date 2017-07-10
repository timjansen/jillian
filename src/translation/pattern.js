'use strict';

const JelType = require('../jel/type.js');
const Tokenizer = require('./tokenizer.js');
const SingleMatchNode = require('./nodes/singlematchnode.js');
const TemplateNode = require('./nodes/templatenode.js');
const MultiOptionsNode = require('./nodes/multioptionsnode.js');
const OptionalOptionsNode = require('./nodes/optionaloptionsnode.js');
const OptionalNode = require('./nodes/optionalnode.js');

class Pattern extends JelType {
	
	constructor(s) {
		super();
		this.tree = this.parse(Tokenizer.tokenize(s)); //=> PatternNode
	}

	parse(tok) {
		const t = tok.next();
		if (!t)
			return undefined;
		else if (t.word) 
			return new SingleMatchNode(t.word, this.parse(tok));
		else if (t.template)
			return new TemplateNode(t.template, t.name, t.hints, t.expression, this.parse(tok));

		switch(t.op) {
			case '[':
				const optionNode = this.parseOptions(tok);
				optionNode.addFollower(this.parse(tok));
				return optionNode;
			case ']':	
			case ']?':
			case '|':
				tok.undo();
				return undefined; 
		}
		throw new Error(`Unexpected token in pattern`);
	}

	parseOptions(tok) {
		const opts = [];
		while(true) {
			const exp = this.parse(tok);
			if (!exp)
				throw new Error(`Option can't be empty`);
			opts.push(exp);
		
			const stopper = tok.next();
			if (!stopper)
				throw new Error(`Unexpected end in option set`);
			if (stopper.op == '|')
				continue;
			if (!opts.length)
				throw new Error(`Unexpected end of option set. Can not be empty.`);

			if (stopper.op == ']?') {
				if (opts.length == 1)
					return OptionalNode.findBest(opts[0]);
				else
					return OptionalOptionsNode.findBest(opts);
			}
			else 
				return MultiOptionsNode.findBest(opts); 
		}
	}
	
}

module.exports = Pattern;