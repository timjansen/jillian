'use strict';

import Runtime from '../Runtime';
import JelObject from '../JelObject';
import Callable from '../Callable';
import Context from '../Context';
import BaseTypeRegistry from '../BaseTypeRegistry';

import JelString from './JelString';
import List from './List';
import Pattern from './Pattern';

import Util from '../../util/Util';
import PatternNode from '../patternNodes/PatternNode';
import TranslatorNode from '../patternNodes/TranslatorNode';
import LambdaResultNode from '../patternNodes/LambdaResultNode';
import StaticResultNode from '../patternNodes/LambdaResultNode';

export default class Translator extends JelObject {
	tree: TranslatorNode = new TranslatorNode();
	
	constructor() {
		super('Translator');
	}

	addPattern(pattern: Pattern, value: any, metaMap: Map<string, any>): Translator {
		pattern.tree.merge(this.tree, new LambdaResultNode(value, metaMap));
		return this;
	}
	
	// Returns nested Array of Matches with properties 'value' and 'meta', or Promise thereof.
	// metaFilter is an optional Set of meta values that must be present in the results
	matchAtPosition(ctx: Context, tokens: string[], idx: number, metaFilter?: Set<string>, incompleteMatch = false): List | Promise<List> {
		return this.tree.match(ctx, tokens, idx, metaFilter, incompleteMatch);
	}
	
	// Returns List of Matches with properties 'value' and 'meta', or a Promise thereof
	// metaFilter is an optional set of meta values that must be present in the results
	match_jel_mapping: Object;
	match(ctx: Context, input: JelString | string | string[], metaFilter?: Set<string>): List | Promise<List> { // TODO: make Set<string> JEL compatible
		if (input instanceof JelString)
			return this.match(ctx, input.value, metaFilter);
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
	
  static create(): Translator {
    return new Translator();
  }
  
	toString(): string {
		return `Translator(${this.tree})`;
	}
}

Translator.prototype.match_jel_mapping = ['input'];
BaseTypeRegistry.register('Translator', Translator);


