'use strict';

class PatternNode {

	constructor(next) {
		this.next = next;
	}

	match(ctx, tokens, idx) {
		if (this.next)
			return this.next.match(ctx, tokens, idx);
		else
			return !tokens[idx];
	}
	
	addFollower(next) {
		if (this.next)
			this.next.addFollower(next);
		else
			this.next = next;
		return this;
	}
	
	toString() {
		return `PatternNode() => ${this.next}`;
	}
}

module.exports = PatternNode;