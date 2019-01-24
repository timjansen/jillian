import Context from '../Context';

export default abstract class MatchNode {

	constructor(public className: string) {
	}

	// returns the either the result or a list of results. Results or list members can be Promises!
	// ctx is the context for evaluating expressions. It also contains a template dictionary.
	// tokens is an array of tokens.
	// idx is the position in the token array.
	// metaFilter is a optional Set of strings to narrow down results. Matches must have all these results.
	// incompleteMatch is true if the input tokens do no have to match till the end of the token array
	match(ctx: Context, tokens: string[], idx: number, metaFilter?: Set<string>, incompleteMatch = false): any {
	}
	
	// appends a node or value to the end of the tree
	append(next?: MatchNode): void {
	}
	
	toString(): string {
		return `MatchNode()`;
	}
}
