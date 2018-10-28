import JEL from './JEL';
import {Token, TokenType, TemplateToken, RegExpToken, FractionToken} from './Token';
import TokenReader from './TokenReader';

import PatternNode from './patternNodes/PatternNode';
import TemplateNode from './patternNodes/TemplateNode';
import RegExpNode from './patternNodes/RegExpNode';

const TERMINATOR = new PatternNode();

export default class PatternParser {
	static parsePattern(tok: TokenReader, jelToken: Token, expectStopper = false, targetNode = new PatternNode()): PatternNode | undefined {
		
		if (!tok.hasNext()) 
			return TERMINATOR;

		const t = tok.next();

		if (t.type == TokenType.Word) 
			return targetNode.addTokenMatch(t.value, PatternParser.parsePattern(tok, jelToken, expectStopper));
		else if (t.type == TokenType.Template) {
			const t0 = t as TemplateToken;
			try {	
				return targetNode.addTemplateMatch(new TemplateNode(t0.template, t0.name, t0.metaFilter, t0.expression ? JEL.parseTree(t0.expression) : undefined, PatternParser.parsePattern(tok, jelToken, expectStopper)));
			}
			catch (e) {
				JEL.throwParseException(jelToken, "Can not parse expression ${t.expression} embedded in pattern", e);
			}
		}
		else if (t.type == TokenType.RegExp) {
			const t0 = t as RegExpToken;
			const regexps = t0.regexps.map(s=>RegExp(s.replace(/^([^^])/, "^$1").replace(/([^$])$/, "$1$")));
			return targetNode.addTemplateMatch(new RegExpNode(regexps, t0.name, t0.expression ? JEL.parseTree(t0.expression) : undefined, PatternParser.parsePattern(tok, jelToken, expectStopper)));
		}

		switch(t.value) {
			case '[':
				while(true) {
					PatternParser.parsePattern(tok, jelToken, true, targetNode);

					const stopper = JEL.nextOrThrow(tok, `Unexpected end in option set`);
					if (stopper.type != TokenType.Operator)
						throw new Error(`Unexpected end in option set`);
					if (stopper.value == ']?') {
						targetNode.makeOptional(PatternParser.parsePattern(tok, jelToken, expectStopper)!);
					}
					else if (stopper.value == ']')
						targetNode.append(PatternParser.parsePattern(tok, jelToken, expectStopper));

					if (stopper.value != '|')
						break;
				}
				return targetNode;
			case ']':	
			case ']?':
			case '|':
				if (expectStopper) {
					tok.undo();
					return undefined;
				}
				throw new Error(`Unexpected operator in pattern: ${t.value}`);
		}
		throw new Error(`Unexpected token in pattern`);
	}
}
  