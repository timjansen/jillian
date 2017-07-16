'use strict';

class PatternNode {

	constructor(next) {
		this.next = next;
	}

	// returns number of next index, possibly as Promise. -1 when complete
	match(ctx, tokens, idx) {
		
	}
	
	addFollower(next) {
		if (this.next)
			this.next.addFollower(next);
		else
			this.next = next;
		return this;
	}
	
	collectArgumentNames(dest) {
		if (this.next) this.next.collectArgumentNames(dest);
		if (this.options) 
			this.options.forEach(el=>el.collectArgumentNames(dest));
	}
	
	// helper for nodes with options
	matchOptions(ctx, tokens, idx) {
		const promises = [];
		for (let i = 0; i < this.options.length; i++) {
			const o = this.options[i];
			const v = o.match(ctx, tokens, idx);
			if (v === true)
				return v;
			else if (v)
				promises.push(v);
		}
		if (!promises.length)
			return false;
		return Promise.all(promises).then(r=>r.find(e=>e) || false);
	}
	
	// helper for nodes with next
	matchNext(ctx, tokens, idx) {
		if (this.next)
			return this.next.match(ctx, tokens, idx);
		else
			return !tokens[idx];
	}
	
	toString() {
		return `PatternNode() => ${this.next}`;
	}
}

module.exports = PatternNode;