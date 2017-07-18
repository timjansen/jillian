'use strict';

class PatternNode {

	constructor(next) {
		this.next = next;
	}

	// returns the result value, or undefined if no match.
	// args is optional map. If set, TemplateNodes write their values in there
	match(ctx, tokens, idx, args) {
	}
	
	// clones the node
	clone() {
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
	
	merge(otherNode, resultNode) {
		// TODO
	}
	
	// helper for nodes with options
	matchOptions(ctx, tokens, idx, args) {
		const promises = [];
		for (let i = 0; i < this.options.length; i++) {
			const o = this.options[i];
			const v = o.match(ctx, tokens, idx, args);
			if (v !== undefined)
				return v;
			else if (v instanceof Promise)
				promises.push(v);
		}
		if (!promises.length)
			return undefined;
		return Promise.all(promises).then(r=>r.find(e=>e!==undefined) || undefined);
	}
	
	// helper for nodes with next
	matchNext(ctx, tokens, idx, args) {
		if (this.next)
			return this.next.match(ctx, tokens, idx, args);
		else
			return tokens[idx] ? undefined : true;
	}
	
	toString() {
		return `PatternNode() => ${this.next}`;
	}
}

module.exports = PatternNode;