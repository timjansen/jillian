'use strict';

import JelType from './JelType';
import List from './List';
import Callable from './Callable';
import Pattern from './Pattern';
import Context from './Context';
import Util from '../util/Util';
import PatternNode from './patternNodes/PatternNode';
import TranslatorNode from './patternNodes/TranslatorNode';
import LambdaResultNode from './patternNodes/LambdaResultNode';
import StaticResultNode from './patternNodes/LambdaResultNode';

export default class Translator extends JelType {
	tree: TranslatorNode = new TranslatorNode();
	
	constructor() {
		super();
	}

	addPattern(pattern: Pattern, value: any, metaMap: Map<string, any>): Translator {
		pattern.tree.merge(this.tree, new LambdaResultNode(value, metaMap));
		return this;
	}
	
	// Returns nested Array of Matches with properties 'value' and 'meta', or Promise thereof.
	// metaFilter is an optional Set of meta values that must be present in the results
	matchAtPosition(ctx: Context, tokens: string[], idx: number, metaFilter?: Set<string>, incompleteMatch = false) {
		return this.tree.match(ctx, tokens, idx, metaFilter, incompleteMatch);
	}
	
	// Returns List of Matches with properties 'value' and 'meta', or a Promise thereof
	// metaFilter is an optional set of meta values that must be present in the results
	match_jel_mapping: Object;
	match(ctx: Context, input: string | string[], metaFilter?: Set<string>): List | Promise<List> {
		if (typeof input == 'string') {
			const trimmed = input.trim();
			return this.match(ctx, trimmed ? trimmed.split(/\s+/g) : [], metaFilter);
		}
		const m = this.matchAtPosition(ctx, input, 0, metaFilter, false);
		if (m instanceof Promise || (Array.isArray(m) && Util.hasRecursive(m, p=>p instanceof Promise)))
			return Util.simplifyPromiseArray(m).then(a=>new List(a));
		else 
			return new List(Util.flattenToArray(m));
	}
	
	matchPromise(ctx: Context, input: string|string[], metaFilter?: Set<string>): Promise<List> {
		return Promise.resolve(this.match(ctx, input, metaFilter));
	}
	
	toString(): string {
		return `Translator(${this.tree})`;
	}
}

Translator.prototype.match_jel_mapping = {'>ctx': true, input: 1, metaFilter: 2};



