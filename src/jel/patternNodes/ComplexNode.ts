import MatchNode from './MatchNode';
import MultiNode from './MultiNode';
import PatternNode from './PatternNode';
import LambdaResultNode from './LambdaResultNode';
import TranslatorNode from './TranslatorNode';
import JelNode from '../expressionNodes/JelNode';
import List from '../List';
import Context from '../Context';
import Util from '../../util/Util';

export default abstract class ComplexNode extends MatchNode {

	constructor(public name?: string, public expression?: JelNode, public next?: MultiNode) {
		super();
	}
	
	abstract merge(resultNode: LambdaResultNode): ComplexNode;
	
	append(next: MultiNode): ComplexNode {
		this.next = next;
		return this;
	}
	
	abstract equals(other: ComplexNode): boolean;
	
	abstract toString(): string;

}
