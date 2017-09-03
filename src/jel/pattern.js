'use strict';

const JelType = require('../jel/type.js');
const TokenReader = require('./tokenreader.js');
const Util = require('../util/util.js');

class Pattern extends JelType {
	
	constructor(tree, patternText) {
		super();
		this.tree = tree; // the PatternNode
		this.patternText = patternText;
	}
	
	// returns Promise!
	matchPromise(ctx, inputOrTokens) {
		return Promise.resolve(this.match(ctx, inputOrTokens));
	}

	// can return value or Promise!!
	match(ctx, inputOrTokens) {
		if (typeof inputOrTokens == 'string') {
			const trimmed = inputOrTokens.trim();
			return this.match(ctx, trimmed ? trimmed.split(/\s+/g) : []);
		}
		const p = this.tree.match(ctx, inputOrTokens, 0);

		if (!p)
			return false;
		else if (p instanceof Promise || (Util.isArrayLike(p) && Util.hasRecursive(p, p=>p instanceof Promise)))
			return Util.simplifyPromiseArray(p0=>p.then(p0=>!!p0.length));
		else
			return (!Util.isArrayLike(p)) || !!p.length;
	}

	toString() {
		return `Pattern(text=\`${this.patternText}\`)`;
	}
	
}

Pattern.prototype.match_jel_mapping = {'>ctx': true, input: 1};


module.exports = Pattern;