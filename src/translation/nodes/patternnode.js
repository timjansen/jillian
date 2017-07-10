'use strict';

class PatternNode {

	constructor(next) {
		this.next = next;
	}

	match(ctx, tokens, idx) {
		if (this.next)
			return this.next.match(ctx, tokens, idx+1);
		else
			return !tokens[idx+1];
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